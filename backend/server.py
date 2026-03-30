from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from fastapi.security import HTTPBearer
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'chess_app')]

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

# Membership Tiers
MEMBERSHIP_TIERS = {
    "free": {"name": "Free", "price": 0, "ai_levels": ["beginner"], "puzzle_limit": 5, "analysis": False},
    "gold": {"name": "Gold", "price": 4.99, "ai_levels": ["beginner", "intermediate"], "puzzle_limit": 20, "analysis": False},
    "platinum": {"name": "Platinum", "price": 9.99, "ai_levels": ["beginner", "intermediate", "advanced"], "puzzle_limit": -1, "analysis": True},
    "diamond": {"name": "Diamond", "price": 19.99, "ai_levels": ["beginner", "intermediate", "advanced", "master"], "puzzle_limit": -1, "analysis": True},
    "owner": {"name": "Owner", "price": 0, "ai_levels": ["beginner", "intermediate", "advanced", "master"], "puzzle_limit": -1, "analysis": True}
}

# Models
class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    membership: str = "free"
    is_owner: bool = False
    puzzle_rating: int = 800
    games_played: int = 0
    games_won: int = 0
    puzzles_solved: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserUpdate(BaseModel):
    membership: Optional[str] = None

class Game(BaseModel):
    game_id: str = Field(default_factory=lambda: f"game_{uuid.uuid4().hex[:12]}")
    white_player_id: str
    black_player_id: Optional[str] = None
    mode: str  # "computer", "local", "online"
    ai_level: Optional[str] = None
    status: str = "active"  # "active", "checkmate", "draw", "resigned", "timeout"
    winner: Optional[str] = None
    moves: List[str] = []
    fen: str = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class GameCreate(BaseModel):
    mode: str
    ai_level: Optional[str] = None

class GameMove(BaseModel):
    move: str
    fen: str

class Puzzle(BaseModel):
    puzzle_id: str
    fen: str
    solution: List[str]
    difficulty: str  # "easy", "medium", "hard", "impossible"
    rating: int
    theme: Optional[str] = None

class PuzzleAttempt(BaseModel):
    user_id: str
    puzzle_id: str
    solved: bool
    moves_made: List[str]
    time_taken: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OnlineMatch(BaseModel):
    match_id: str = Field(default_factory=lambda: f"match_{uuid.uuid4().hex[:12]}")
    player1_id: str
    player2_id: Optional[str] = None
    game_id: Optional[str] = None
    status: str = "waiting"  # "waiting", "matched", "playing", "finished"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Helper functions
async def get_current_user(request: Request) -> Optional[User]:
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        return None
    
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        return None
    
    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None
    
    user_doc = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user_doc:
        return None
    
    return User(**user_doc)

async def require_auth(request: Request) -> User:
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

# Auth endpoints
@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Exchange session_id for user data from Emergent Auth
    async with httpx.AsyncClient() as client:
        auth_response = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        if auth_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        auth_data = auth_response.json()
    
    email = auth_data.get("email")
    name = auth_data.get("name")
    picture = auth_data.get("picture")
    session_token = auth_data.get("session_token")
    
    # Check if first user (becomes owner)
    user_count = await db.users.count_documents({})
    is_owner = user_count == 0
    
    # Find or create user
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user info
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture}}
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        new_user = User(
            user_id=user_id,
            email=email,
            name=name,
            picture=picture,
            is_owner=is_owner,
            membership="owner" if is_owner else "free"
        )
        await db.users.insert_one(new_user.model_dump())
    
    # Create session
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    }
    await db.user_sessions.insert_one(session_doc)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        path="/"
    )
    
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user_doc

@api_router.get("/auth/me")
async def get_me(user: User = Depends(require_auth)):
    return user.model_dump()

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out"}

# User endpoints
@api_router.get("/users/me")
async def get_user_profile(user: User = Depends(require_auth)):
    tier_info = MEMBERSHIP_TIERS.get(user.membership, MEMBERSHIP_TIERS["free"])
    return {
        **user.model_dump(),
        "tier_info": tier_info
    }

@api_router.put("/users/me/membership")
async def update_membership(update: UserUpdate, user: User = Depends(require_auth)):
    if update.membership and update.membership in MEMBERSHIP_TIERS:
        # Owner always keeps owner status
        if user.is_owner:
            update.membership = "owner"
        await db.users.update_one(
            {"user_id": user.user_id},
            {"$set": {"membership": update.membership}}
        )
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    return user_doc

@api_router.get("/membership/tiers")
async def get_membership_tiers():
    return MEMBERSHIP_TIERS

# Game endpoints
@api_router.post("/games")
async def create_game(game_data: GameCreate, user: User = Depends(require_auth)):
    # Check AI level access
    if game_data.mode == "computer" and game_data.ai_level:
        tier_info = MEMBERSHIP_TIERS.get(user.membership, MEMBERSHIP_TIERS["free"])
        if game_data.ai_level not in tier_info["ai_levels"]:
            raise HTTPException(status_code=403, detail=f"AI level '{game_data.ai_level}' requires higher membership")
    
    game = Game(
        white_player_id=user.user_id,
        mode=game_data.mode,
        ai_level=game_data.ai_level
    )
    
    if game_data.mode == "computer":
        game.black_player_id = "computer"
    elif game_data.mode == "local":
        game.black_player_id = "local_player"
    
    await db.games.insert_one(game.model_dump())
    return game.model_dump()

@api_router.get("/games/{game_id}")
async def get_game(game_id: str, user: User = Depends(require_auth)):
    game = await db.games.find_one({"game_id": game_id}, {"_id": 0})
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game

@api_router.put("/games/{game_id}/move")
async def make_move(game_id: str, move_data: GameMove, user: User = Depends(require_auth)):
    game = await db.games.find_one({"game_id": game_id}, {"_id": 0})
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    moves = game.get("moves", [])
    moves.append(move_data.move)
    
    await db.games.update_one(
        {"game_id": game_id},
        {"$set": {
            "moves": moves,
            "fen": move_data.fen,
            "updated_at": datetime.now(timezone.utc)
        }}
    )
    
    return {"success": True, "fen": move_data.fen}

@api_router.put("/games/{game_id}/end")
async def end_game(game_id: str, request: Request, user: User = Depends(require_auth)):
    body = await request.json()
    status = body.get("status", "finished")
    winner = body.get("winner")
    
    await db.games.update_one(
        {"game_id": game_id},
        {"$set": {
            "status": status,
            "winner": winner,
            "updated_at": datetime.now(timezone.utc)
        }}
    )
    
    # Update user stats
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$inc": {"games_played": 1, "games_won": 1 if winner == user.user_id else 0}}
    )
    
    return {"success": True}

@api_router.get("/games/history/me")
async def get_game_history(user: User = Depends(require_auth)):
    games = await db.games.find(
        {"$or": [{"white_player_id": user.user_id}, {"black_player_id": user.user_id}]},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    return games

# Online matchmaking
@api_router.post("/matchmaking/queue")
async def join_queue(user: User = Depends(require_auth)):
    # Check if already in queue
    existing = await db.matchmaking.find_one(
        {"player1_id": user.user_id, "status": "waiting"},
        {"_id": 0}
    )
    if existing:
        return existing
    
    # Look for waiting match
    waiting_match = await db.matchmaking.find_one(
        {"status": "waiting", "player1_id": {"$ne": user.user_id}},
        {"_id": 0}
    )
    
    if waiting_match:
        # Create game and update match
        game = Game(
            white_player_id=waiting_match["player1_id"],
            black_player_id=user.user_id,
            mode="online"
        )
        await db.games.insert_one(game.model_dump())
        
        await db.matchmaking.update_one(
            {"match_id": waiting_match["match_id"]},
            {"$set": {
                "player2_id": user.user_id,
                "game_id": game.game_id,
                "status": "matched"
            }}
        )
        
        match_doc = await db.matchmaking.find_one({"match_id": waiting_match["match_id"]}, {"_id": 0})
        return match_doc
    else:
        # Create new waiting match
        new_match = OnlineMatch(player1_id=user.user_id)
        await db.matchmaking.insert_one(new_match.model_dump())
        return new_match.model_dump()

@api_router.get("/matchmaking/status/{match_id}")
async def get_match_status(match_id: str, user: User = Depends(require_auth)):
    match = await db.matchmaking.find_one({"match_id": match_id}, {"_id": 0})
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return match

@api_router.delete("/matchmaking/queue")
async def leave_queue(user: User = Depends(require_auth)):
    await db.matchmaking.delete_many({"player1_id": user.user_id, "status": "waiting"})
    return {"success": True}

# Puzzle endpoints
@api_router.get("/puzzles")
async def get_puzzles(difficulty: Optional[str] = None, user: User = Depends(require_auth)):
    query = {}
    if difficulty:
        query["difficulty"] = difficulty
    
    puzzles = await db.puzzles.find(query, {"_id": 0}).limit(50).to_list(50)
    return puzzles

@api_router.get("/puzzles/random")
async def get_random_puzzle(difficulty: Optional[str] = None, user: User = Depends(require_auth)):
    # Check puzzle limit
    tier_info = MEMBERSHIP_TIERS.get(user.membership, MEMBERSHIP_TIERS["free"])
    puzzle_limit = tier_info["puzzle_limit"]
    
    if puzzle_limit > 0:
        today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        attempts_today = await db.puzzle_attempts.count_documents({
            "user_id": user.user_id,
            "created_at": {"$gte": today}
        })
        if attempts_today >= puzzle_limit:
            raise HTTPException(status_code=403, detail=f"Daily puzzle limit ({puzzle_limit}) reached. Upgrade for unlimited puzzles!")
    
    query = {}
    if difficulty:
        query["difficulty"] = difficulty
    
    puzzles = await db.puzzles.find(query, {"_id": 0}).to_list(100)
    if not puzzles:
        raise HTTPException(status_code=404, detail="No puzzles available")
    
    return random.choice(puzzles)

@api_router.get("/puzzles/{puzzle_id}")
async def get_puzzle(puzzle_id: str, user: User = Depends(require_auth)):
    puzzle = await db.puzzles.find_one({"puzzle_id": puzzle_id}, {"_id": 0})
    if not puzzle:
        raise HTTPException(status_code=404, detail="Puzzle not found")
    return puzzle

@api_router.post("/puzzles/{puzzle_id}/attempt")
async def submit_puzzle_attempt(puzzle_id: str, request: Request, user: User = Depends(require_auth)):
    body = await request.json()
    solved = body.get("solved", False)
    moves_made = body.get("moves_made", [])
    time_taken = body.get("time_taken", 0)
    
    attempt = PuzzleAttempt(
        user_id=user.user_id,
        puzzle_id=puzzle_id,
        solved=solved,
        moves_made=moves_made,
        time_taken=time_taken
    )
    await db.puzzle_attempts.insert_one(attempt.model_dump())
    
    # Update user stats
    if solved:
        await db.users.update_one(
            {"user_id": user.user_id},
            {"$inc": {"puzzles_solved": 1, "puzzle_rating": 10}}
        )
    else:
        await db.users.update_one(
            {"user_id": user.user_id},
            {"$inc": {"puzzle_rating": -5}}
        )
    
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    return {"success": True, "new_rating": user_doc.get("puzzle_rating", 800)}

@api_router.get("/puzzles/stats/me")
async def get_puzzle_stats(user: User = Depends(require_auth)):
    attempts = await db.puzzle_attempts.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).to_list(1000)
    
    total = len(attempts)
    solved = sum(1 for a in attempts if a.get("solved"))
    
    return {
        "total_attempts": total,
        "solved": solved,
        "success_rate": (solved / total * 100) if total > 0 else 0,
        "rating": user.puzzle_rating
    }

# Seed puzzles endpoint
@api_router.post("/admin/seed-puzzles")
async def seed_puzzles(user: User = Depends(require_auth)):
    if not user.is_owner:
        raise HTTPException(status_code=403, detail="Only owner can seed puzzles")
    
    puzzles = [
        # Easy puzzles (mate in 1)
        {"puzzle_id": "p001", "fen": "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4", "solution": ["Qxf7#"], "difficulty": "easy", "rating": 600, "theme": "mate_in_1"},
        {"puzzle_id": "p002", "fen": "rnbqkbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3", "solution": ["Qxh4"], "difficulty": "easy", "rating": 650, "theme": "capture"},
        {"puzzle_id": "p003", "fen": "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5Q2/PPPP1PPP/RNB1KBNR w KQkq - 2 3", "solution": ["Qxf7#"], "difficulty": "easy", "rating": 700, "theme": "mate_in_1"},
        {"puzzle_id": "p004", "fen": "6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1", "solution": ["Re8#"], "difficulty": "easy", "rating": 550, "theme": "back_rank_mate"},
        {"puzzle_id": "p005", "fen": "r1b1kb1r/pppp1ppp/5q2/4n3/3KP3/2N3PN/PPP4P/R1BQ1B1R b kq - 0 1", "solution": ["Qf2#"], "difficulty": "easy", "rating": 620, "theme": "mate_in_1"},
        
        # Medium puzzles (mate in 2 or tactics)
        {"puzzle_id": "p006", "fen": "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4", "solution": ["Ng5", "d5", "Nxf7"], "difficulty": "medium", "rating": 1000, "theme": "knight_fork"},
        {"puzzle_id": "p007", "fen": "r2qkbnr/ppp2ppp/2np4/4p3/2B1P1b1/5N2/PPPP1PPP/RNBQ1RK1 w kq - 0 1", "solution": ["Bxf7+", "Ke7", "Bg5"], "difficulty": "medium", "rating": 1100, "theme": "pin"},
        {"puzzle_id": "p008", "fen": "r1bq1rk1/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQ1RK1 w - - 0 1", "solution": ["Bxf7+", "Rxf7", "Ng5"], "difficulty": "medium", "rating": 1150, "theme": "sacrifice"},
        {"puzzle_id": "p009", "fen": "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 w kq - 0 1", "solution": ["Ng5", "O-O", "Qh5"], "difficulty": "medium", "rating": 1050, "theme": "attack"},
        {"puzzle_id": "p010", "fen": "rnbqk2r/pppp1ppp/5n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4", "solution": ["Bxf7+", "Kxf7", "Ng5+"], "difficulty": "medium", "rating": 1200, "theme": "sacrifice"},
        
        # Hard puzzles (mate in 3+ or complex tactics)
        {"puzzle_id": "p011", "fen": "r1bqr1k1/ppp2ppp/2np1n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 w - - 0 1", "solution": ["Bxf7+", "Kh8", "Ng5", "Qe8", "Qh5"], "difficulty": "hard", "rating": 1500, "theme": "attack"},
        {"puzzle_id": "p012", "fen": "r1b1k2r/ppppqppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 0 1", "solution": ["Bg5", "h6", "Bxf6", "Qxf6", "Nd5"], "difficulty": "hard", "rating": 1600, "theme": "positional"},
        {"puzzle_id": "p013", "fen": "r2q1rk1/ppp1bppp/2np1n2/4p1B1/2B1P3/3P1N2/PPP2PPP/R2Q1RK1 w - - 0 1", "solution": ["Nd5", "Nxd5", "Bxe7", "Nxe7", "exd5"], "difficulty": "hard", "rating": 1550, "theme": "exchange"},
        {"puzzle_id": "p014", "fen": "r1bqkb1r/1ppp1ppp/p1n2n2/4p3/B3P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1", "solution": ["Bxf7+", "Ke7", "Bb3", "d5", "Nxe5"], "difficulty": "hard", "rating": 1650, "theme": "sacrifice"},
        {"puzzle_id": "p015", "fen": "r1bq1rk1/pp1nbppp/2p1pn2/3p4/2PP4/2NBPN2/PP3PPP/R1BQ1RK1 w - - 0 1", "solution": ["cxd5", "exd5", "Nxd5", "Nxd5", "Bxh7+"], "difficulty": "hard", "rating": 1700, "theme": "greek_gift"},
        
        # Impossible puzzles (grandmaster level)
        {"puzzle_id": "p016", "fen": "r1bq1rk1/pp2bppp/2n1pn2/2pp4/3P4/2PBPN2/PP1N1PPP/R1BQ1RK1 w - - 0 1", "solution": ["dxc5", "d4", "exd4", "Nxd4", "Nxd4", "Qxd4", "Bc4"], "difficulty": "impossible", "rating": 2000, "theme": "positional"},
        {"puzzle_id": "p017", "fen": "r2qr1k1/pppbbppp/2n1pn2/3p4/3P4/2NBPN2/PPP2PPP/R1BQR1K1 w - - 0 1", "solution": ["Bxh7+", "Kxh7", "Ng5+", "Kg8", "Qh5", "Re7", "Qxf7+"], "difficulty": "impossible", "rating": 2100, "theme": "sacrifice"},
        {"puzzle_id": "p018", "fen": "r1bq1rk1/pp1nbppp/2p1pn2/3p4/2PP4/1PNBPN2/P4PPP/R1BQ1RK1 w - - 0 1", "solution": ["cxd5", "cxd5", "Nb5", "a6", "Nc7", "Ra7", "Bf5"], "difficulty": "impossible", "rating": 2200, "theme": "knight_outpost"},
        {"puzzle_id": "p019", "fen": "r2q1rk1/pb1nbppp/1p2pn2/2pp4/3P4/2PBPN2/PP1N1PPP/R1BQ1RK1 w - - 0 1", "solution": ["dxc5", "bxc5", "e4", "d4", "e5", "dxc3", "exf6"], "difficulty": "impossible", "rating": 2300, "theme": "pawn_break"},
        {"puzzle_id": "p020", "fen": "r1bqr1k1/pp1nbppp/2p1pn2/3p4/2PP4/2NBPN2/PP3PPP/R1BQR1K1 w - - 0 1", "solution": ["Bf5", "exf5", "Rxe7", "Qxe7", "cxd5", "Nxd5", "Nxd5"], "difficulty": "impossible", "rating": 2400, "theme": "exchange_sacrifice"}
    ]
    
    # Clear existing and insert new
    await db.puzzles.delete_many({})
    for puzzle in puzzles:
        await db.puzzles.insert_one(puzzle)
    
    return {"message": f"Seeded {len(puzzles)} puzzles"}

# Opening Explorer - Chess openings database
CHESS_OPENINGS = [
    # King's Pawn Openings (e4)
    {
        "opening_id": "italian_game",
        "name": "Italian Game",
        "eco": "C50-C54",
        "moves": ["e4", "e5", "Nf3", "Nc6", "Bc4"],
        "fen": "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3",
        "description": "One of the oldest openings, aiming to control the center and attack f7.",
        "difficulty": "beginner",
        "category": "open_game",
        "main_ideas": ["Control d5 and f7", "Rapid development", "Castle kingside quickly"],
        "famous_games": ["Evergreen Game - Anderssen vs Dufresne 1852"]
    },
    {
        "opening_id": "ruy_lopez",
        "name": "Ruy Lopez (Spanish Game)",
        "eco": "C60-C99",
        "moves": ["e4", "e5", "Nf3", "Nc6", "Bb5"],
        "fen": "r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3",
        "description": "Named after Spanish priest Ruy López de Segura. One of the most popular openings.",
        "difficulty": "intermediate",
        "category": "open_game",
        "main_ideas": ["Pressure on e5 pawn", "Long-term positional play", "Many strategic plans"],
        "famous_games": ["Game of the Century - Fischer vs Byrne 1956"]
    },
    {
        "opening_id": "sicilian_defense",
        "name": "Sicilian Defense",
        "eco": "B20-B99",
        "moves": ["e4", "c5"],
        "fen": "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2",
        "description": "The most popular response to 1.e4. Leads to asymmetrical positions.",
        "difficulty": "intermediate",
        "category": "semi_open",
        "main_ideas": ["Fight for d4 square", "Counterattack on queenside", "Asymmetrical pawn structure"],
        "famous_games": ["Kasparov vs Topalov 1999 - Najdorf Sicilian"]
    },
    {
        "opening_id": "french_defense",
        "name": "French Defense",
        "eco": "C00-C19",
        "moves": ["e4", "e6"],
        "fen": "rnbqkbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
        "description": "Solid defense that leads to strategic, closed positions.",
        "difficulty": "intermediate",
        "category": "semi_open",
        "main_ideas": ["Solid pawn structure", "Counter in the center with d5", "Attack on the queenside"],
        "famous_games": ["Alekhine vs Nimzowitsch 1930"]
    },
    {
        "opening_id": "caro_kann",
        "name": "Caro-Kann Defense",
        "eco": "B10-B19",
        "moves": ["e4", "c6"],
        "fen": "rnbqkbnr/pp1ppppp/2p5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
        "description": "Solid defense preparing d5, similar to French but avoids bad bishop.",
        "difficulty": "intermediate",
        "category": "semi_open",
        "main_ideas": ["Solid pawn structure", "Good bishop development", "Less cramped than French"],
        "famous_games": ["Karpov vs Kasparov 1984 World Championship"]
    },
    {
        "opening_id": "scandinavian",
        "name": "Scandinavian Defense",
        "eco": "B01",
        "moves": ["e4", "d5"],
        "fen": "rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2",
        "description": "Immediately challenges White's e4 pawn. Simple and direct.",
        "difficulty": "beginner",
        "category": "semi_open",
        "main_ideas": ["Immediate central challenge", "Quick development", "Simple plans"],
        "famous_games": ["Anand vs Leko 2000"]
    },
    # Queen's Pawn Openings (d4)
    {
        "opening_id": "queens_gambit",
        "name": "Queen's Gambit",
        "eco": "D06-D69",
        "moves": ["d4", "d5", "c4"],
        "fen": "rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq c3 0 2",
        "description": "Classic opening offering a pawn sacrifice for central control.",
        "difficulty": "intermediate",
        "category": "closed_game",
        "main_ideas": ["Central control", "Pressure on d5", "Minority attack on queenside"],
        "famous_games": ["Kasparov vs Karpov 1985 World Championship"]
    },
    {
        "opening_id": "kings_indian",
        "name": "King's Indian Defense",
        "eco": "E60-E99",
        "moves": ["d4", "Nf6", "c4", "g6"],
        "fen": "rnbqkb1r/pppppp1p/5np1/8/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3",
        "description": "Hypermodern defense, allowing White to build center then attacking it.",
        "difficulty": "advanced",
        "category": "indian_defense",
        "main_ideas": ["Kingside attack", "e5 pawn break", "Dynamic counterplay"],
        "famous_games": ["Kasparov vs Topalov 1999"]
    },
    {
        "opening_id": "nimzo_indian",
        "name": "Nimzo-Indian Defense",
        "eco": "E20-E59",
        "moves": ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4"],
        "fen": "rnbqk2r/pppp1ppp/4pn2/8/1bPP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 2 4",
        "description": "Flexible defense pinning the knight and fighting for e4.",
        "difficulty": "advanced",
        "category": "indian_defense",
        "main_ideas": ["Control e4 square", "Double White's pawns", "Flexible pawn structure"],
        "famous_games": ["Fischer vs Spassky 1972 Game 6"]
    },
    {
        "opening_id": "grunfeld",
        "name": "Grünfeld Defense",
        "eco": "D70-D99",
        "moves": ["d4", "Nf6", "c4", "g6", "Nc3", "d5"],
        "fen": "rnbqkb1r/ppp1pp1p/5np1/3p4/2PP4/2N5/PP2PPPP/R1BQKBNR w KQkq d6 0 4",
        "description": "Hypermodern opening attacking White's center with pieces.",
        "difficulty": "advanced",
        "category": "indian_defense",
        "main_ideas": ["Attack White's center", "Pressure on d4", "Active piece play"],
        "famous_games": ["Kasparov vs Karpov 1987"]
    },
    {
        "opening_id": "slav_defense",
        "name": "Slav Defense",
        "eco": "D10-D19",
        "moves": ["d4", "d5", "c4", "c6"],
        "fen": "rnbqkbnr/pp2pppp/2p5/3p4/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3",
        "description": "Solid defense to Queen's Gambit, protecting d5 with c6.",
        "difficulty": "intermediate",
        "category": "closed_game",
        "main_ideas": ["Solid pawn structure", "Develop light-squared bishop", "Counter in center"],
        "famous_games": ["Carlsen vs Anand 2014 World Championship"]
    },
    {
        "opening_id": "london_system",
        "name": "London System",
        "eco": "D02",
        "moves": ["d4", "d5", "Bf4"],
        "fen": "rnbqkbnr/ppp1pppp/8/3p4/3P1B2/8/PPP1PPPP/RN1QKBNR b KQkq - 1 2",
        "description": "Solid system for White, easy to learn with consistent setup.",
        "difficulty": "beginner",
        "category": "closed_game",
        "main_ideas": ["Solid development", "Control e5 square", "Safe kingside castle"],
        "famous_games": ["Carlsen's many London System games"]
    },
    # Flank Openings
    {
        "opening_id": "english_opening",
        "name": "English Opening",
        "eco": "A10-A39",
        "moves": ["c4"],
        "fen": "rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR b KQkq c3 0 1",
        "description": "Flexible flank opening controlling d5 from the side.",
        "difficulty": "intermediate",
        "category": "flank",
        "main_ideas": ["Control d5", "Flexible pawn structure", "Can transpose to many openings"],
        "famous_games": ["Botvinnik's English Opening games"]
    },
    {
        "opening_id": "reti_opening",
        "name": "Réti Opening",
        "eco": "A04-A09",
        "moves": ["Nf3", "d5", "c4"],
        "fen": "rnbqkbnr/ppp1pppp/8/3p4/2P5/5N2/PP1PPPPP/RNBQKB1R b KQkq c3 0 2",
        "description": "Hypermodern opening delaying central pawn moves.",
        "difficulty": "advanced",
        "category": "flank",
        "main_ideas": ["Hypermodern control", "Fianchetto bishops", "Flexible structure"],
        "famous_games": ["Réti vs Alekhine 1925"]
    },
    # Gambits
    {
        "opening_id": "kings_gambit",
        "name": "King's Gambit",
        "eco": "C30-C39",
        "moves": ["e4", "e5", "f4"],
        "fen": "rnbqkbnr/pppp1ppp/8/4p3/4PP2/8/PPPP2PP/RNBQKBNR b KQkq f3 0 2",
        "description": "Romantic era gambit sacrificing f-pawn for rapid attack.",
        "difficulty": "advanced",
        "category": "gambit",
        "main_ideas": ["Rapid development", "Open f-file", "Attack on f7"],
        "famous_games": ["Immortal Game - Anderssen vs Kieseritzky 1851"]
    },
    {
        "opening_id": "evans_gambit",
        "name": "Evans Gambit",
        "eco": "C51-C52",
        "moves": ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "b4"],
        "fen": "r1bqk1nr/pppp1ppp/2n5/2b1p3/1PB1P3/5N2/P1PP1PPP/RNBQK2R b KQkq b3 0 4",
        "description": "Romantic gambit sacrificing b-pawn for rapid development.",
        "difficulty": "intermediate",
        "category": "gambit",
        "main_ideas": ["Rapid development", "Open lines", "Attack on king"],
        "famous_games": ["Morphy vs Duke of Brunswick 1858"]
    }
]

# Opening Explorer endpoints
@api_router.get("/openings")
async def get_openings(category: Optional[str] = None, difficulty: Optional[str] = None):
    openings = CHESS_OPENINGS
    
    if category:
        openings = [o for o in openings if o["category"] == category]
    if difficulty:
        openings = [o for o in openings if o["difficulty"] == difficulty]
    
    return openings

@api_router.get("/openings/categories")
async def get_opening_categories():
    return {
        "open_game": "Open Games (1.e4 e5)",
        "semi_open": "Semi-Open Games (1.e4, Black doesn't play e5)",
        "closed_game": "Closed Games (1.d4 d5)",
        "indian_defense": "Indian Defenses (1.d4 Nf6)",
        "flank": "Flank Openings (c4, Nf3)",
        "gambit": "Gambits (Pawn sacrifices)"
    }

@api_router.get("/openings/{opening_id}")
async def get_opening(opening_id: str):
    opening = next((o for o in CHESS_OPENINGS if o["opening_id"] == opening_id), None)
    if not opening:
        raise HTTPException(status_code=404, detail="Opening not found")
    return opening

# Game Analysis endpoints
@api_router.get("/games/{game_id}/analysis")
async def get_game_analysis(game_id: str, user: User = Depends(require_auth)):
    # Check if user has analysis feature
    tier_info = MEMBERSHIP_TIERS.get(user.membership, MEMBERSHIP_TIERS["free"])
    if not tier_info.get("analysis"):
        raise HTTPException(status_code=403, detail="Game analysis requires Platinum membership or higher")
    
    game = await db.games.find_one({"game_id": game_id}, {"_id": 0})
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    moves = game.get("moves", [])
    
    # Generate analysis for each move
    analysis = []
    for i, move in enumerate(moves):
        # Simple evaluation based on move characteristics
        evaluation = analyze_move(move, i)
        analysis.append({
            "move_number": i + 1,
            "move": move,
            "evaluation": evaluation["eval"],
            "classification": evaluation["classification"],
            "comment": evaluation["comment"]
        })
    
    # Game summary
    blunders = sum(1 for a in analysis if a["classification"] == "blunder")
    mistakes = sum(1 for a in analysis if a["classification"] == "mistake")
    good_moves = sum(1 for a in analysis if a["classification"] == "good")
    excellent = sum(1 for a in analysis if a["classification"] == "excellent")
    
    return {
        "game_id": game_id,
        "total_moves": len(moves),
        "analysis": analysis,
        "summary": {
            "blunders": blunders,
            "mistakes": mistakes,
            "good_moves": good_moves,
            "excellent_moves": excellent,
            "accuracy": round((good_moves + excellent) / max(len(moves), 1) * 100, 1)
        }
    }

def analyze_move(move: str, move_index: int) -> dict:
    """Simple move analysis - in production would use a chess engine"""
    import random
    
    # Check for captures, checks, castling
    is_capture = 'x' in move
    is_check = '+' in move or '#' in move
    is_castle = move in ['O-O', 'O-O-O']
    is_promotion = '=' in move
    
    # Simple heuristic evaluation
    if '#' in move:  # Checkmate
        return {"eval": 10.0, "classification": "excellent", "comment": "Checkmate!"}
    elif is_check and is_capture:
        return {"eval": random.uniform(1.0, 2.0), "classification": "excellent", "comment": "Strong attacking move with check"}
    elif is_castle:
        return {"eval": random.uniform(0.2, 0.5), "classification": "good", "comment": "Good - King safety"}
    elif is_capture:
        classifications = ["good", "good", "excellent", "mistake"]
        classification = random.choice(classifications)
        evals = {"excellent": random.uniform(0.5, 1.5), "good": random.uniform(0.0, 0.5), "mistake": random.uniform(-1.0, -0.3)}
        comments = {"excellent": "Excellent capture!", "good": "Good capture", "mistake": "Questionable capture"}
        return {"eval": evals[classification], "classification": classification, "comment": comments[classification]}
    elif is_promotion:
        return {"eval": random.uniform(2.0, 4.0), "classification": "excellent", "comment": "Pawn promotion!"}
    else:
        # Random classification for other moves
        classifications = ["good", "good", "good", "excellent", "mistake", "blunder"]
        weights = [0.4, 0.2, 0.2, 0.1, 0.08, 0.02]
        classification = random.choices(classifications, weights=weights)[0]
        evals = {"excellent": random.uniform(0.3, 1.0), "good": random.uniform(-0.2, 0.3), "mistake": random.uniform(-1.0, -0.3), "blunder": random.uniform(-3.0, -1.0)}
        comments = {
            "excellent": "Excellent move!",
            "good": "Solid move",
            "mistake": "This could be improved",
            "blunder": "Significant error"
        }
        return {"eval": evals[classification], "classification": classification, "comment": comments[classification]}

@api_router.post("/admin/seed-openings")
async def seed_openings(user: User = Depends(require_auth)):
    if not user.is_owner:
        raise HTTPException(status_code=403, detail="Only owner can seed openings")
    
    # Openings are stored in memory, this endpoint just confirms they're available
    return {"message": f"Openings database ready with {len(CHESS_OPENINGS)} openings"}

# Health check
@api_router.get("/")
async def root():
    return {"message": "Chess App API", "status": "running"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
