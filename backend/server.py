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
    "gold": {"name": "Gold", "price": 2.99, "ai_levels": ["beginner", "intermediate"], "puzzle_limit": 25, "analysis": False},
    "platinum": {"name": "Platinum", "price": 5.99, "ai_levels": ["beginner", "intermediate", "advanced"], "puzzle_limit": -1, "analysis": True},
    "diamond": {"name": "Diamond", "price": 9.99, "ai_levels": ["beginner", "intermediate", "advanced", "master"], "puzzle_limit": -1, "analysis": True},
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
        # ===== EASY PUZZLES (Mate in 1, Simple Captures) =====
        {"puzzle_id": "e001", "fen": "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4", "solution": ["Qxf7#"], "difficulty": "easy", "rating": 500, "theme": "scholars_mate"},
        {"puzzle_id": "e002", "fen": "6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1", "solution": ["Re8#"], "difficulty": "easy", "rating": 550, "theme": "back_rank_mate"},
        {"puzzle_id": "e003", "fen": "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5Q2/PPPP1PPP/RNB1KBNR w KQkq - 2 3", "solution": ["Qxf7#"], "difficulty": "easy", "rating": 520, "theme": "mate_in_1"},
        {"puzzle_id": "e004", "fen": "rnbqkbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3", "solution": ["Qxh4"], "difficulty": "easy", "rating": 480, "theme": "capture_queen"},
        {"puzzle_id": "e005", "fen": "r1b1kb1r/pppp1ppp/5q2/4n3/3KP3/2N3PN/PPP4P/R1BQ1B1R b kq - 0 1", "solution": ["Qf2#"], "difficulty": "easy", "rating": 530, "theme": "mate_in_1"},
        {"puzzle_id": "e006", "fen": "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4", "solution": ["Bxf7+"], "difficulty": "easy", "rating": 600, "theme": "fork"},
        {"puzzle_id": "e007", "fen": "rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3", "solution": ["Nxe4"], "difficulty": "easy", "rating": 560, "theme": "free_piece"},
        {"puzzle_id": "e008", "fen": "r1bqkbnr/pppp1ppp/2n5/4N3/4P3/8/PPPP1PPP/RNBQKB1R b KQkq - 0 3", "solution": ["Qg5"], "difficulty": "easy", "rating": 580, "theme": "attack_piece"},
        {"puzzle_id": "e009", "fen": "rnb1kbnr/ppppqppp/8/4N3/4P3/8/PPPP1PPP/RNBQKB1R w KQkq - 2 4", "solution": ["Nxf7"], "difficulty": "easy", "rating": 620, "theme": "royal_fork"},
        {"puzzle_id": "e010", "fen": "r2qkb1r/ppp1pppp/2n2n2/3p4/3P1Bb1/2N2N2/PPP1PPPP/R2QKB1R b KQkq - 5 5", "solution": ["Bxf3"], "difficulty": "easy", "rating": 590, "theme": "remove_defender"},
        {"puzzle_id": "e011", "fen": "rnbqkbnr/ppp2ppp/4p3/3pP3/3P4/8/PPP2PPP/RNBQKBNR b KQkq - 0 3", "solution": ["c5"], "difficulty": "easy", "rating": 540, "theme": "pawn_break"},
        {"puzzle_id": "e012", "fen": "r1bqk2r/pppp1ppp/2n2n2/4p3/1bB1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 4 4", "solution": ["O-O"], "difficulty": "easy", "rating": 510, "theme": "castling"},
        {"puzzle_id": "e013", "fen": "r1bqkb1r/1ppp1ppp/p1n2n2/4p3/B3P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4", "solution": ["Bxf7+"], "difficulty": "easy", "rating": 640, "theme": "check"},
        {"puzzle_id": "e014", "fen": "rnbqkb1r/pppp1ppp/5n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 3 3", "solution": ["g6"], "difficulty": "easy", "rating": 490, "theme": "defense"},
        {"puzzle_id": "e015", "fen": "r1bqkbnr/pppp1Bpp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 3", "solution": ["Kxf7"], "difficulty": "easy", "rating": 470, "theme": "recapture"},
        
        # ===== MEDIUM PUZZLES (Mate in 2, Tactics) =====
        {"puzzle_id": "m001", "fen": "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4", "solution": ["Ng5", "d5", "Nxf7"], "difficulty": "medium", "rating": 1000, "theme": "fried_liver"},
        {"puzzle_id": "m002", "fen": "r2qkbnr/ppp2ppp/2np4/4p3/2B1P1b1/5N2/PPPP1PPP/RNBQ1RK1 w kq - 0 5", "solution": ["Bxf7+", "Ke7", "Bg5"], "difficulty": "medium", "rating": 1100, "theme": "pin"},
        {"puzzle_id": "m003", "fen": "r1bq1rk1/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQ1RK1 w - - 0 6", "solution": ["Bxf7+", "Rxf7", "Ng5"], "difficulty": "medium", "rating": 1150, "theme": "sacrifice"},
        {"puzzle_id": "m004", "fen": "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 w kq - 6 5", "solution": ["Ng5", "O-O", "Qh5"], "difficulty": "medium", "rating": 1050, "theme": "attack"},
        {"puzzle_id": "m005", "fen": "rnbqk2r/pppp1ppp/5n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4", "solution": ["Bxf7+", "Kxf7", "Ng5+"], "difficulty": "medium", "rating": 1200, "theme": "double_attack"},
        {"puzzle_id": "m006", "fen": "r1bqkb1r/pppp1ppp/2n2n2/4p3/3PP3/5N2/PPP2PPP/RNBQKB1R b KQkq d3 0 4", "solution": ["exd4", "Nxd4", "Nxd4"], "difficulty": "medium", "rating": 950, "theme": "center_control"},
        {"puzzle_id": "m007", "fen": "r1bqk2r/ppp2ppp/2n1pn2/3p4/1bPP4/2N2N2/PP2PPPP/R1BQKB1R w KQkq - 2 5", "solution": ["cxd5", "exd5", "Bg5"], "difficulty": "medium", "rating": 1080, "theme": "isolated_pawn"},
        {"puzzle_id": "m008", "fen": "rnbqkb1r/pp2pppp/5n2/2pp4/3P4/2N2N2/PPP1PPPP/R1BQKB1R w KQkq c6 0 4", "solution": ["dxc5", "Qa5", "Bd2"], "difficulty": "medium", "rating": 1020, "theme": "tempo"},
        {"puzzle_id": "m009", "fen": "r1bq1rk1/ppp2ppp/2n1pn2/3p4/1bPP4/2NBPN2/PP3PPP/R1BQK2R b KQ - 1 7", "solution": ["dxc4", "Bxc4", "b5"], "difficulty": "medium", "rating": 1120, "theme": "pawn_storm"},
        {"puzzle_id": "m010", "fen": "r2qkbnr/ppp2ppp/2n1p3/3pPb2/3P4/5N2/PPP2PPP/RNBQKB1R w KQkq - 1 5", "solution": ["Bb5", "Qd7", "c4"], "difficulty": "medium", "rating": 1180, "theme": "development"},
        {"puzzle_id": "m011", "fen": "r1bqk2r/ppp1bppp/2n1pn2/3p4/2PP4/2N2NP1/PP2PP1P/R1BQKB1R b KQkq - 0 6", "solution": ["dxc4", "Bg2", "Nd5"], "difficulty": "medium", "rating": 1070, "theme": "catalan"},
        {"puzzle_id": "m012", "fen": "rnbqkb1r/ppp1pppp/5n2/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq c3 0 3", "solution": ["dxc4", "e3", "b5"], "difficulty": "medium", "rating": 990, "theme": "queens_gambit_accepted"},
        {"puzzle_id": "m013", "fen": "r1bqkbnr/pp1ppppp/2n5/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq c6 0 3", "solution": ["d4", "cxd4", "Nxd4"], "difficulty": "medium", "rating": 1030, "theme": "open_sicilian"},
        {"puzzle_id": "m014", "fen": "rnbqkb1r/pp2pppp/3p1n2/2p5/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 0 4", "solution": ["d4", "cxd4", "Nxd4"], "difficulty": "medium", "rating": 1060, "theme": "sicilian_najdorf"},
        {"puzzle_id": "m015", "fen": "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2P2N2/PP1P1PPP/RNBQK2R b KQkq - 0 4", "solution": ["d5", "exd5", "Nxd5"], "difficulty": "medium", "rating": 1140, "theme": "central_break"},
        
        # ===== HARD PUZZLES (Complex Tactics, Mate in 3+) =====
        {"puzzle_id": "h001", "fen": "r1bqr1k1/ppp2ppp/2np1n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 w - - 0 8", "solution": ["Bxf7+", "Kh8", "Ng5", "Qe8", "Qh5"], "difficulty": "hard", "rating": 1500, "theme": "greek_gift"},
        {"puzzle_id": "h002", "fen": "r1b1k2r/ppppqppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 6 6", "solution": ["Bg5", "h6", "Bxf6", "Qxf6", "Nd5"], "difficulty": "hard", "rating": 1600, "theme": "positional"},
        {"puzzle_id": "h003", "fen": "r2q1rk1/ppp1bppp/2np1n2/4p1B1/2B1P3/3P1N2/PPP2PPP/R2Q1RK1 w - - 0 9", "solution": ["Nd5", "Nxd5", "Bxe7", "Nxe7", "exd5"], "difficulty": "hard", "rating": 1550, "theme": "exchange"},
        {"puzzle_id": "h004", "fen": "r1bqkb1r/1ppp1ppp/p1n2n2/4p3/B3P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4", "solution": ["Bxf7+", "Ke7", "Bb3", "d5", "Nxe5"], "difficulty": "hard", "rating": 1650, "theme": "sacrifice"},
        {"puzzle_id": "h005", "fen": "r1bq1rk1/pp1nbppp/2p1pn2/3p4/2PP4/2NBPN2/PP3PPP/R1BQ1RK1 w - - 0 9", "solution": ["cxd5", "exd5", "Nxd5", "Nxd5", "Bxh7+"], "difficulty": "hard", "rating": 1700, "theme": "greek_gift"},
        {"puzzle_id": "h006", "fen": "r2qk2r/ppp1bppp/2n1bn2/3pp3/4P3/1NN1BP2/PPP3PP/R2QKB1R w KQkq - 0 8", "solution": ["Nxd5", "Nxd5", "exd5", "Bxb3", "dxe6"], "difficulty": "hard", "rating": 1580, "theme": "combination"},
        {"puzzle_id": "h007", "fen": "r1bq1rk1/pp2ppbp/2np1np1/8/3NP3/2N1BP2/PPP3PP/R2QKB1R w KQ - 0 9", "solution": ["Bc4", "Qa5", "Bb3", "Qc5", "Be3"], "difficulty": "hard", "rating": 1620, "theme": "dragon_sicilian"},
        {"puzzle_id": "h008", "fen": "r1bqk2r/pp1nbppp/2p1pn2/3p4/2PP4/2NBPN2/PP3PPP/R1BQK2R w KQkq - 0 7", "solution": ["O-O", "O-O", "b3", "b6", "Bb2"], "difficulty": "hard", "rating": 1540, "theme": "queenside_fianchetto"},
        {"puzzle_id": "h009", "fen": "rn1qkb1r/pp2pppp/2p2n2/3p4/2PP2b1/2N2N2/PP2PPPP/R1BQKB1R w KQkq - 2 5", "solution": ["Ne5", "Bh5", "cxd5", "cxd5", "Qb3"], "difficulty": "hard", "rating": 1680, "theme": "slav_defense"},
        {"puzzle_id": "h010", "fen": "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQ1RK1 b kq - 0 5", "solution": ["Ng4", "O-O", "Qh4", "h3", "Nxf2"], "difficulty": "hard", "rating": 1720, "theme": "kingside_attack"},
        {"puzzle_id": "h011", "fen": "r1b1kb1r/pp1nqppp/2p1pn2/3p4/2PP4/2N1PN2/PP3PPP/R1BQKB1R w KQkq - 0 7", "solution": ["Bd3", "dxc4", "Bxc4", "b5", "Bd3"], "difficulty": "hard", "rating": 1560, "theme": "semi_slav"},
        {"puzzle_id": "h012", "fen": "rnbqk2r/ppp1bppp/4pn2/3p4/2PP4/2N2N2/PP2PPPP/R1BQKB1R w KQkq - 2 5", "solution": ["Bg5", "h6", "Bxf6", "Bxf6", "e3"], "difficulty": "hard", "rating": 1640, "theme": "qgd"},
        {"puzzle_id": "h013", "fen": "r1bq1rk1/pp1nbppp/2p1p3/3n4/2BP4/2N1PN2/PP3PPP/R1BQ1RK1 w - - 0 10", "solution": ["Bxd5", "cxd5", "Nxd5", "exd5", "Qxd5"], "difficulty": "hard", "rating": 1590, "theme": "central_control"},
        {"puzzle_id": "h014", "fen": "r2qkb1r/pp1bpppp/2np1n2/1B6/3NP3/2N5/PPP2PPP/R1BQK2R b KQkq - 5 7", "solution": ["a6", "Ba4", "b5", "Bb3", "Nxd4"], "difficulty": "hard", "rating": 1670, "theme": "rauzer_sicilian"},
        {"puzzle_id": "h015", "fen": "r1bq1rk1/pp2ppbp/2np1np1/8/2BNP3/2N1B3/PPP2PPP/R2QK2R w KQ - 2 9", "solution": ["f3", "Nc5", "Qd2", "a5", "O-O-O"], "difficulty": "hard", "rating": 1750, "theme": "yugoslav_attack"},
        
        # ===== IMPOSSIBLE PUZZLES (Grandmaster Level) =====
        {"puzzle_id": "i001", "fen": "r1bq1rk1/pp2bppp/2n1pn2/2pp4/3P4/2PBPN2/PP1N1PPP/R1BQ1RK1 w - - 0 9", "solution": ["dxc5", "d4", "exd4", "Nxd4", "Nxd4", "Qxd4", "Bc4"], "difficulty": "impossible", "rating": 2000, "theme": "positional"},
        {"puzzle_id": "i002", "fen": "r2qr1k1/pppbbppp/2n1pn2/3p4/3P4/2NBPN2/PPP2PPP/R1BQR1K1 w - - 0 10", "solution": ["Bxh7+", "Kxh7", "Ng5+", "Kg8", "Qh5", "Re7", "Qxf7+"], "difficulty": "impossible", "rating": 2100, "theme": "sacrifice"},
        {"puzzle_id": "i003", "fen": "r1bq1rk1/pp1nbppp/2p1pn2/3p4/2PP4/1PNBPN2/P4PPP/R1BQ1RK1 w - - 0 10", "solution": ["cxd5", "cxd5", "Nb5", "a6", "Nc7", "Ra7", "Bf5"], "difficulty": "impossible", "rating": 2200, "theme": "knight_outpost"},
        {"puzzle_id": "i004", "fen": "r2q1rk1/pb1nbppp/1p2pn2/2pp4/3P4/2PBPN2/PP1N1PPP/R1BQ1RK1 w - - 0 10", "solution": ["dxc5", "bxc5", "e4", "d4", "e5", "dxc3", "exf6"], "difficulty": "impossible", "rating": 2300, "theme": "pawn_break"},
        {"puzzle_id": "i005", "fen": "r1bqr1k1/pp1nbppp/2p1pn2/3p4/2PP4/2NBPN2/PP3PPP/R1BQR1K1 w - - 0 10", "solution": ["Bf5", "exf5", "Rxe7", "Qxe7", "cxd5", "Nxd5", "Nxd5"], "difficulty": "impossible", "rating": 2400, "theme": "exchange_sacrifice"},
        {"puzzle_id": "i006", "fen": "r1b2rk1/pp1nqppp/2p1pn2/3p4/1bPP4/2NBPN2/PP3PPP/R1BQ1RK1 w - - 4 10", "solution": ["a3", "Ba5", "b4", "Bc7", "c5", "b6", "Bb2"], "difficulty": "impossible", "rating": 2050, "theme": "minority_attack"},
        {"puzzle_id": "i007", "fen": "r1bq1rk1/pppn1pbp/3p1np1/4p3/2PPP3/2N2N2/PP2BPPP/R1BQ1RK1 w - - 0 9", "solution": ["d5", "Nc5", "b4", "Na6", "a3", "f5", "Nd2"], "difficulty": "impossible", "rating": 2150, "theme": "kings_indian"},
        {"puzzle_id": "i008", "fen": "r1bq1rk1/pp2ppbp/2np1np1/8/3NP3/2N1BP2/PPP3PP/R2QKB1R w KQ - 0 9", "solution": ["Qd2", "O-O", "O-O-O", "d5", "exd5", "Nxd5", "Nxc6"], "difficulty": "impossible", "rating": 2250, "theme": "opposite_castling"},
        {"puzzle_id": "i009", "fen": "r2qkb1r/1p1n1ppp/p2ppn2/8/3NP1b1/2N1B3/PPP2PPP/R2QKB1R w KQkq - 0 9", "solution": ["f3", "Bh5", "Qd2", "Qc7", "O-O-O", "O-O-O", "Kb1"], "difficulty": "impossible", "rating": 2350, "theme": "najdorf_english_attack"},
        {"puzzle_id": "i010", "fen": "r1bqk2r/pp1nbppp/2p1p3/3pP3/3P4/2NB1N2/PPP2PPP/R1BQK2R b KQkq - 0 8", "solution": ["c5", "dxc5", "Bxc5", "O-O", "Nc6", "b4", "Bb6"], "difficulty": "impossible", "rating": 2450, "theme": "advance_french"},
        {"puzzle_id": "i011", "fen": "r1bq1rk1/ppp1npbp/3p1np1/3Pp3/2P1P3/2N2N2/PP2BPPP/R1BQ1RK1 w - - 0 10", "solution": ["Bg5", "h6", "Be3", "Ng4", "Bd2", "f5", "h3"], "difficulty": "impossible", "rating": 2080, "theme": "benoni"},
        {"puzzle_id": "i012", "fen": "rnbqkb1r/pp3ppp/4pn2/2ppP3/3P4/2P2N2/PP3PPP/RNBQKB1R b KQkq - 0 5", "solution": ["Nfd7", "a3", "Be7", "b4", "O-O", "Bb2", "f6"], "difficulty": "impossible", "rating": 2180, "theme": "tarrasch_french"},
        {"puzzle_id": "i013", "fen": "r1bqk2r/pppn1ppp/4pn2/3p4/1bPP4/2N1PN2/PP3PPP/R1BQKB1R w KQkq - 4 6", "solution": ["a3", "Ba5", "Bd3", "c5", "b4", "cxd4", "bxa5"], "difficulty": "impossible", "rating": 2280, "theme": "nimzo_rubinstein"},
        {"puzzle_id": "i014", "fen": "r1bq1rk1/pp2bppp/2n1pn2/2Pp4/3P4/2NBPN2/PP3PPP/R1BQ1RK1 b - - 0 9", "solution": ["e5", "dxe5", "Nxe5", "Nxe5", "Bxe5", "Nd7", "Bf4"], "difficulty": "impossible", "rating": 2380, "theme": "exchange_qgd"},
        {"puzzle_id": "i015", "fen": "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R b KQkq - 0 5", "solution": ["a6", "O-O", "Ba7", "Be3", "Bxe3", "fxe3", "d6"], "difficulty": "impossible", "rating": 2480, "theme": "italian_slow"},
        
        # ===== MORE EASY PUZZLES =====
        {"puzzle_id": "e016", "fen": "r1bqk2r/pppp1Npp/2n2n2/2b1p3/2B1P3/8/PPPP1PPP/RNBQK2R b KQkq - 0 5", "solution": ["Qe7"], "difficulty": "easy", "rating": 520, "theme": "defend_piece"},
        {"puzzle_id": "e017", "fen": "rnbqkbnr/ppp2ppp/4p3/3p4/3PP3/8/PPP2PPP/RNBQKBNR w KQkq d6 0 3", "solution": ["exd5"], "difficulty": "easy", "rating": 480, "theme": "capture"},
        {"puzzle_id": "e018", "fen": "rnbqkb1r/ppp2ppp/4pn2/3p4/2PP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 2 4", "solution": ["cxd5"], "difficulty": "easy", "rating": 510, "theme": "exchange"},
        {"puzzle_id": "e019", "fen": "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4", "solution": ["c3"], "difficulty": "easy", "rating": 490, "theme": "development"},
        {"puzzle_id": "e020", "fen": "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2", "solution": ["Nc6"], "difficulty": "easy", "rating": 450, "theme": "development"},
        {"puzzle_id": "e021", "fen": "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3", "solution": ["Bc4"], "difficulty": "easy", "rating": 470, "theme": "development"},
        {"puzzle_id": "e022", "fen": "rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3", "solution": ["Nxe5"], "difficulty": "easy", "rating": 550, "theme": "win_pawn"},
        {"puzzle_id": "e023", "fen": "r1bqkbnr/pppp1ppp/2n5/4N3/4P3/8/PPPP1PPP/RNBQKB1R b KQkq - 0 3", "solution": ["Nxe5"], "difficulty": "easy", "rating": 530, "theme": "recapture"},
        {"puzzle_id": "e024", "fen": "rnb1kbnr/ppppqppp/8/4p3/4PP2/8/PPPP2PP/RNBQKBNR w KQkq - 1 3", "solution": ["Qh5+"], "difficulty": "easy", "rating": 580, "theme": "check"},
        {"puzzle_id": "e025", "fen": "rnbqkbnr/pp2pppp/2p5/3pP3/3P4/8/PPP2PPP/RNBQKBNR b KQkq - 0 3", "solution": ["Bf5"], "difficulty": "easy", "rating": 560, "theme": "development"},
        
        # ===== MORE MEDIUM PUZZLES =====
        {"puzzle_id": "m016", "fen": "r1bqkbnr/pp1ppppp/2n5/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq c6 0 3", "solution": ["d4", "cxd4", "Nxd4"], "difficulty": "medium", "rating": 980, "theme": "open_sicilian"},
        {"puzzle_id": "m017", "fen": "rnbqk2r/pppp1ppp/4pn2/8/1bPP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 2 4", "solution": ["e3", "O-O", "Bd3"], "difficulty": "medium", "rating": 1040, "theme": "nimzo_indian"},
        {"puzzle_id": "m018", "fen": "rnbqkb1r/pp2pppp/5n2/2ppP3/3P4/2N5/PPP2PPP/R1BQKBNR b KQkq - 0 4", "solution": ["Nfd7", "f4", "Nc6"], "difficulty": "medium", "rating": 1090, "theme": "advance_variation"},
        {"puzzle_id": "m019", "fen": "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3", "solution": ["Bc5", "c3", "Nf6"], "difficulty": "medium", "rating": 920, "theme": "giuoco_piano"},
        {"puzzle_id": "m020", "fen": "rnbqkb1r/ppp2ppp/4pn2/3p4/2PP4/2N2N2/PP2PPPP/R1BQKB1R b KQkq - 1 4", "solution": ["Be7", "Bf4", "O-O"], "difficulty": "medium", "rating": 1010, "theme": "qgd_orthodox"},
        {"puzzle_id": "m021", "fen": "rnbqkb1r/pp2pppp/2p2n2/3p4/2PP4/2N2N2/PP2PPPP/R1BQKB1R b KQkq - 1 4", "solution": ["e6", "e3", "Nbd7"], "difficulty": "medium", "rating": 1050, "theme": "semi_slav"},
        {"puzzle_id": "m022", "fen": "rnbqkb1r/pppppp1p/5np1/8/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3", "solution": ["Nc3", "Bg7", "e4"], "difficulty": "medium", "rating": 1080, "theme": "kings_indian_setup"},
        {"puzzle_id": "m023", "fen": "rnbqkb1r/pppp1ppp/4pn2/8/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3", "solution": ["Nc3", "Bb4", "e3"], "difficulty": "medium", "rating": 1020, "theme": "nimzo_indian_setup"},
        {"puzzle_id": "m024", "fen": "r1bqkbnr/pppp1ppp/2n5/4p3/3PP3/5N2/PPP2PPP/RNBQKB1R b KQkq d3 0 3", "solution": ["exd4", "Nxd4", "Nf6"], "difficulty": "medium", "rating": 970, "theme": "scotch_response"},
        {"puzzle_id": "m025", "fen": "rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3", "solution": ["Nxe4", "d4", "d5"], "difficulty": "medium", "rating": 1130, "theme": "two_knights_trap"},
        
        # ===== MORE HARD PUZZLES =====
        {"puzzle_id": "h016", "fen": "r1bq1rk1/ppp2ppp/2n1pn2/3p4/1bPP4/2NBPN2/PP3PPP/R1BQK2R w KQ - 5 7", "solution": ["O-O", "dxc4", "Bxc4", "b5", "Bd3"], "difficulty": "hard", "rating": 1530, "theme": "qid_main_line"},
        {"puzzle_id": "h017", "fen": "r2qkb1r/pp1bpppp/2np1n2/1B6/3NP3/2N5/PPP2PPP/R1BQK2R b KQkq - 5 7", "solution": ["e6", "O-O", "Be7", "Bxc6", "bxc6"], "difficulty": "hard", "rating": 1610, "theme": "sicilian_richter_rauzer"},
        {"puzzle_id": "h018", "fen": "r1bqk2r/pp1nbppp/2p1p3/3p4/2PP4/2NBPN2/PP3PPP/R1BQK2R b KQkq - 2 7", "solution": ["Nf8", "O-O", "Ng6", "Re1", "Be7"], "difficulty": "hard", "rating": 1680, "theme": "caro_kann_classical"},
        {"puzzle_id": "h019", "fen": "r1bqkb1r/pp1n1ppp/2p1pn2/3p4/2PP4/2N1PN2/PP3PPP/R1BQKB1R w KQkq - 0 6", "solution": ["Bd3", "dxc4", "Bxc4", "b5", "Bd3"], "difficulty": "hard", "rating": 1570, "theme": "meran_variation"},
        {"puzzle_id": "h020", "fen": "rnbqk2r/ppp1bppp/4pn2/3p4/2PP4/2N2N2/PP2PPPP/R1BQKB1R w KQkq - 2 5", "solution": ["Bg5", "h6", "Bxf6", "Bxf6", "e3"], "difficulty": "hard", "rating": 1650, "theme": "qgd_exchange"},
        {"puzzle_id": "h021", "fen": "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2P2N2/PP1P1PPP/RNBQK2R b KQkq - 0 4", "solution": ["Nxe4", "d4", "exd3", "Qb3", "Qe7"], "difficulty": "hard", "rating": 1720, "theme": "italian_gambit"},
        {"puzzle_id": "h022", "fen": "r2qkbnr/ppp2ppp/2np4/4p1B1/4P1b1/2NP1N2/PPP2PPP/R2QKB1R b KQkq - 3 5", "solution": ["Qf6", "Be3", "Bxf3", "Qxf3", "Qxf3"], "difficulty": "hard", "rating": 1580, "theme": "philidor_attack"},
        {"puzzle_id": "h023", "fen": "rnbqk2r/ppp1bppp/4pn2/3p4/2PP4/5NP1/PP2PP1P/RNBQKB1R b KQkq - 0 5", "solution": ["dxc4", "Bg2", "Nc6", "O-O", "O-O"], "difficulty": "hard", "rating": 1630, "theme": "catalan_open"},
        {"puzzle_id": "h024", "fen": "r1bq1rk1/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 b - - 0 6", "solution": ["d6", "Bg5", "h6", "Bh4", "g5"], "difficulty": "hard", "rating": 1690, "theme": "italian_anti_berlin"},
        {"puzzle_id": "h025", "fen": "r1bqkb1r/1ppp1ppp/p1n2n2/4p3/B3P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4", "solution": ["Bxc6", "dxc6", "Nxe5", "Qd4", "Nf3"], "difficulty": "hard", "rating": 1740, "theme": "ruy_lopez_exchange"},
        
        # ===== MORE IMPOSSIBLE PUZZLES =====
        {"puzzle_id": "i016", "fen": "r1bq1rk1/pp1nbppp/2p1pn2/3p4/2PP4/2N1PN2/PPB2PPP/R1BQ1RK1 w - - 4 9", "solution": ["b3", "a5", "a4", "Ba6", "Bb2", "Rc8", "Qe2"], "difficulty": "impossible", "rating": 2020, "theme": "carlsbad_structure"},
        {"puzzle_id": "i017", "fen": "r2q1rk1/ppp1bppp/2n1bn2/3pp3/4P3/1NN1BP2/PPP3PP/R2QKB1R w KQ - 0 9", "solution": ["Nxd5", "Nxd5", "exd5", "Bxb3", "dxe6", "Bxa2", "exf7+"], "difficulty": "impossible", "rating": 2130, "theme": "pawn_sacrifice"},
        {"puzzle_id": "i018", "fen": "r1b1kb1r/1pqn1ppp/p2ppn2/8/3NP3/2N1B3/PPP1BPPP/R2QK2R w KQkq - 0 9", "solution": ["f4", "e5", "fxe5", "dxe5", "Nf5", "Qd8", "Bc4"], "difficulty": "impossible", "rating": 2220, "theme": "najdorf_english_attack"},
        {"puzzle_id": "i019", "fen": "r1bqk2r/pp1nbppp/2p1p3/3pP3/2PP4/2N2N2/PP3PPP/R1BQKB1R b KQkq - 0 7", "solution": ["f6", "Bd3", "Nc5", "Bc2", "fxe5", "dxe5", "Nd7"], "difficulty": "impossible", "rating": 2320, "theme": "advance_french_main"},
        {"puzzle_id": "i020", "fen": "r1bq1rk1/pp2bppp/2n1pn2/2Pp4/3P4/2NBPN2/PP3PPP/R1BQ1RK1 b - - 0 9", "solution": ["e5", "dxe5", "Nxe5", "Nxe5", "Bxe5", "Nd7", "Bg3"], "difficulty": "impossible", "rating": 2420, "theme": "exchange_queens_gambit"},
        {"puzzle_id": "i021", "fen": "rnbqk2r/ppp1bppp/4pn2/3p2B1/2PP4/2N5/PP2PPPP/R2QKBNR w KQkq - 2 5", "solution": ["e3", "h6", "Bh4", "O-O", "Nf3", "Ne4", "Bxe7"], "difficulty": "impossible", "rating": 2050, "theme": "qgd_lasker"},
        {"puzzle_id": "i022", "fen": "r1bqk2r/pp1nbppp/2p1p3/3p4/2PP4/2NBPN2/PP3PPP/R1BQK2R b KQkq - 2 7", "solution": ["Ngf6", "O-O", "O-O", "b3", "b6", "Bb2", "Bb7"], "difficulty": "impossible", "rating": 2150, "theme": "semi_slav_meran"},
        {"puzzle_id": "i023", "fen": "r1bq1rk1/pppnbppp/4p3/3pP2n/3P4/2NBBN2/PPP2PPP/R2QK2R w KQ - 5 9", "solution": ["g4", "Ng7", "Qd2", "c5", "dxc5", "Nxc5", "Bd4"], "difficulty": "impossible", "rating": 2250, "theme": "french_winawer"},
        {"puzzle_id": "i024", "fen": "r1b1k2r/ppppqppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 4 6", "solution": ["Bg5", "h6", "Bh4", "g5", "Nxg5", "hxg5", "Bxg5"], "difficulty": "impossible", "rating": 2350, "theme": "italian_evan_gambit"},
        {"puzzle_id": "i025", "fen": "r1bqkb1r/pp1n1ppp/2p1pn2/3p4/2PP4/2N1PN2/PP3PPP/R1BQKB1R w KQkq - 0 6", "solution": ["Bd3", "dxc4", "Bxc4", "b5", "Bd3", "a6", "e4"], "difficulty": "impossible", "rating": 2450, "theme": "semi_slav_main"},
        
        # ===== ADDITIONAL 100 PUZZLES =====
        # Easy Batch 2
        {"puzzle_id": "e026", "fen": "rnbqkbnr/pppp1ppp/8/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR b KQkq - 1 2", "solution": ["Nc6"], "difficulty": "easy", "rating": 460, "theme": "development"},
        {"puzzle_id": "e027", "fen": "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3", "solution": ["Nf6"], "difficulty": "easy", "rating": 470, "theme": "development"},
        {"puzzle_id": "e028", "fen": "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4", "solution": ["d3"], "difficulty": "easy", "rating": 480, "theme": "solid_move"},
        {"puzzle_id": "e029", "fen": "rnbqkbnr/ppp2ppp/4p3/3p4/2PP4/8/PP2PPPP/RNBQKBNR w KQkq d6 0 3", "solution": ["cxd5"], "difficulty": "easy", "rating": 490, "theme": "exchange"},
        {"puzzle_id": "e030", "fen": "rnbqkbnr/pp2pppp/2p5/3p4/2PP4/8/PP2PPPP/RNBQKBNR w KQkq d6 0 3", "solution": ["Nc3"], "difficulty": "easy", "rating": 450, "theme": "development"},
        {"puzzle_id": "e031", "fen": "rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 2 3", "solution": ["d3"], "difficulty": "easy", "rating": 440, "theme": "solid_center"},
        {"puzzle_id": "e032", "fen": "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3", "solution": ["Bb5"], "difficulty": "easy", "rating": 500, "theme": "ruy_lopez_start"},
        {"puzzle_id": "e033", "fen": "rnbqkb1r/ppp2ppp/4pn2/3p4/2PP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 2 4", "solution": ["Bg5"], "difficulty": "easy", "rating": 510, "theme": "pin"},
        {"puzzle_id": "e034", "fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1", "solution": ["e5"], "difficulty": "easy", "rating": 400, "theme": "opening_move"},
        {"puzzle_id": "e035", "fen": "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1", "solution": ["d5"], "difficulty": "easy", "rating": 400, "theme": "opening_move"},
        {"puzzle_id": "e036", "fen": "rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2", "solution": ["exd5"], "difficulty": "easy", "rating": 420, "theme": "capture"},
        {"puzzle_id": "e037", "fen": "rnbqkbnr/ppp1pppp/8/3P4/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 2", "solution": ["Qxd5"], "difficulty": "easy", "rating": 430, "theme": "recapture"},
        {"puzzle_id": "e038", "fen": "rnb1kbnr/pppp1ppp/4p3/8/3Pq3/8/PPP2PPP/RNBQKBNR w KQkq - 0 4", "solution": ["Be2"], "difficulty": "easy", "rating": 520, "theme": "defense"},
        {"puzzle_id": "e039", "fen": "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3", "solution": ["Bc5"], "difficulty": "easy", "rating": 480, "theme": "development"},
        {"puzzle_id": "e040", "fen": "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4", "solution": ["O-O"], "difficulty": "easy", "rating": 460, "theme": "castling"},
        
        # Medium Batch 2
        {"puzzle_id": "m026", "fen": "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4", "solution": ["Ng5", "d5", "exd5"], "difficulty": "medium", "rating": 1000, "theme": "attack_f7"},
        {"puzzle_id": "m027", "fen": "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2P2N2/PP1P1PPP/RNBQK2R b KQkq - 0 4", "solution": ["d6", "d4", "exd4"], "difficulty": "medium", "rating": 950, "theme": "center_play"},
        {"puzzle_id": "m028", "fen": "rnbqkb1r/pp2pppp/2p2n2/3p4/2PP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 0 4", "solution": ["Nf3", "e6", "e3"], "difficulty": "medium", "rating": 920, "theme": "slav_setup"},
        {"puzzle_id": "m029", "fen": "rnbqkb1r/pppp1ppp/4pn2/8/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3", "solution": ["Nc3", "Bb4", "e3"], "difficulty": "medium", "rating": 980, "theme": "nimzo_setup"},
        {"puzzle_id": "m030", "fen": "rnbqkb1r/pppppp1p/5np1/8/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3", "solution": ["Nc3", "Bg7", "e4"], "difficulty": "medium", "rating": 960, "theme": "kings_indian_setup"},
        {"puzzle_id": "m031", "fen": "r1bqkbnr/pppp1ppp/2n5/4p3/3PP3/5N2/PPP2PPP/RNBQKB1R b KQkq d3 0 3", "solution": ["exd4", "Nxd4", "Nf6"], "difficulty": "medium", "rating": 940, "theme": "scotch_game"},
        {"puzzle_id": "m032", "fen": "rnbqkbnr/pppp1ppp/8/4p3/4PP2/8/PPPP2PP/RNBQKBNR b KQkq f3 0 2", "solution": ["exf4", "Nf3", "d5"], "difficulty": "medium", "rating": 1020, "theme": "kings_gambit"},
        {"puzzle_id": "m033", "fen": "rnbqkb1r/ppp2ppp/4pn2/3p4/2PP4/2N2N2/PP2PPPP/R1BQKB1R b KQkq - 1 4", "solution": ["c6", "e3", "Nbd7"], "difficulty": "medium", "rating": 1010, "theme": "semi_slav"},
        {"puzzle_id": "m034", "fen": "r1bqkbnr/pp1ppppp/2n5/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq c6 0 3", "solution": ["Bb5", "d6", "O-O"], "difficulty": "medium", "rating": 990, "theme": "rossolimo"},
        {"puzzle_id": "m035", "fen": "rnbqkb1r/pp2pppp/3p1n2/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 4", "solution": ["d4", "cxd4", "Nxd4"], "difficulty": "medium", "rating": 970, "theme": "open_sicilian"},
        {"puzzle_id": "m036", "fen": "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/2N5/PPPP1PPP/R1BQKBNR w KQkq - 2 3", "solution": ["Bc4", "Nf6", "d3"], "difficulty": "medium", "rating": 900, "theme": "vienna_game"},
        {"puzzle_id": "m037", "fen": "rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3", "solution": ["d4", "Nxe4", "Bd3"], "difficulty": "medium", "rating": 1050, "theme": "petrov_attack"},
        {"puzzle_id": "m038", "fen": "rnbqkbnr/ppp2ppp/4p3/3p4/3PP3/8/PPP2PPP/RNBQKBNR w KQkq d6 0 3", "solution": ["e5", "c5", "c3"], "difficulty": "medium", "rating": 1030, "theme": "french_advance"},
        {"puzzle_id": "m039", "fen": "rnbqkbnr/pp2pppp/2p5/3p4/3PP3/8/PPP2PPP/RNBQKBNR w KQkq d6 0 3", "solution": ["Nc3", "dxe4", "Nxe4"], "difficulty": "medium", "rating": 1040, "theme": "caro_kann_main"},
        {"puzzle_id": "m040", "fen": "r1bqkb1r/pppp1ppp/2n2n2/4p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 4 4", "solution": ["Bb5", "Nd4", "Nxd4"], "difficulty": "medium", "rating": 1060, "theme": "four_knights"},
        
        # Hard Batch 2
        {"puzzle_id": "h026", "fen": "r1bq1rk1/ppp2ppp/2n1pn2/3p4/1bPP4/2NBPN2/PP3PPP/R1BQK2R w KQ - 5 7", "solution": ["O-O", "dxc4", "Bxc4", "Bd6", "a3"], "difficulty": "hard", "rating": 1520, "theme": "qid_main"},
        {"puzzle_id": "h027", "fen": "r1bqkb1r/pp1n1ppp/2p1pn2/3p4/2PP4/2N1PN2/PP3PPP/R1BQKB1R w KQkq - 0 6", "solution": ["Bd3", "dxc4", "Bxc4", "b5", "Bd3"], "difficulty": "hard", "rating": 1560, "theme": "meran"},
        {"puzzle_id": "h028", "fen": "r1bqk2r/pp1nbppp/2p1pn2/3p4/2PP4/2NBPN2/PP3PPP/R1BQK2R b KQkq - 2 7", "solution": ["O-O", "O-O", "dxc4", "Bxc4", "b5"], "difficulty": "hard", "rating": 1590, "theme": "semi_slav_main"},
        {"puzzle_id": "h029", "fen": "rnbqk2r/ppp1bppp/4pn2/3p2B1/2PP4/2N5/PP2PPPP/R2QKBNR w KQkq - 2 5", "solution": ["e3", "h6", "Bh4", "O-O", "Nf3"], "difficulty": "hard", "rating": 1620, "theme": "qgd_exchange"},
        {"puzzle_id": "h030", "fen": "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R b KQkq - 0 4", "solution": ["d6", "c3", "O-O", "O-O", "a6"], "difficulty": "hard", "rating": 1550, "theme": "italian_main"},
        {"puzzle_id": "h031", "fen": "r1bq1rk1/pp1nbppp/2p1p3/3p4/2PP4/2NBPN2/PP3PPP/R1BQ1RK1 w - - 4 9", "solution": ["b3", "a5", "a3", "Ba6", "Bb2"], "difficulty": "hard", "rating": 1640, "theme": "carlsbad"},
        {"puzzle_id": "h032", "fen": "r2qkb1r/pp1bpppp/2np1n2/1B6/3NP3/2N5/PPP2PPP/R1BQK2R b KQkq - 5 7", "solution": ["e6", "O-O", "Be7", "Re1", "O-O"], "difficulty": "hard", "rating": 1580, "theme": "sicilian_classical"},
        {"puzzle_id": "h033", "fen": "r1bqk2r/pp1nbppp/2p1p3/3pP3/3P4/2N2N2/PPP2PPP/R1BQKB1R b KQkq - 0 7", "solution": ["Nh6", "Bd3", "Nf5", "O-O", "Be7"], "difficulty": "hard", "rating": 1670, "theme": "french_classical"},
        {"puzzle_id": "h034", "fen": "r1bqkb1r/pp1n1ppp/2p1pn2/3p4/2PP4/2N2NP1/PP2PP1P/R1BQKB1R b KQkq - 0 6", "solution": ["dxc4", "Bg2", "Nd5", "O-O", "Be7"], "difficulty": "hard", "rating": 1710, "theme": "catalan"},
        {"puzzle_id": "h035", "fen": "r1bq1rk1/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 b - - 0 6", "solution": ["d6", "Bg5", "h6", "Bh4", "Be6"], "difficulty": "hard", "rating": 1600, "theme": "italian_giuoco"},
        {"puzzle_id": "h036", "fen": "r1bqkbnr/pp1n1ppp/2p1p3/3pP3/3P4/2N5/PPP2PPP/R1BQKBNR w KQkq - 0 5", "solution": ["f4", "c5", "Nf3", "Nc6", "Be3"], "difficulty": "hard", "rating": 1650, "theme": "french_advance_main"},
        {"puzzle_id": "h037", "fen": "rnbqk2r/ppp1bppp/4pn2/3p4/2PP4/5NP1/PP2PP1P/RNBQKB1R b KQkq - 0 5", "solution": ["O-O", "Bg2", "dxc4", "O-O", "Nc6"], "difficulty": "hard", "rating": 1690, "theme": "catalan_open"},
        {"puzzle_id": "h038", "fen": "r1bq1rk1/ppp1npbp/3p1np1/3Pp3/2P1P3/2N2N2/PP2BPPP/R1BQ1RK1 w - - 0 9", "solution": ["Bg5", "h6", "Be3", "Ng4", "Bd2"], "difficulty": "hard", "rating": 1730, "theme": "kings_indian_classical"},
        {"puzzle_id": "h039", "fen": "r1bqk2r/ppp2ppp/2n1pn2/3p4/1bPP4/2N1PN2/PP3PPP/R1BQKB1R w KQkq - 2 5", "solution": ["Bd3", "c5", "O-O", "cxd4", "exd4"], "difficulty": "hard", "rating": 1660, "theme": "nimzo_classical"},
        {"puzzle_id": "h040", "fen": "r1bqk2r/pp1nbppp/2p1p3/3p4/2PP4/2N1PN2/PP3PPP/R1BQKB1R b KQkq - 0 6", "solution": ["Ngf6", "Bd3", "O-O", "O-O", "dxc4"], "difficulty": "hard", "rating": 1700, "theme": "semi_slav_meran"},
        
        # Impossible Batch 2
        {"puzzle_id": "i026", "fen": "r1b1kb1r/1pqn1ppp/p2ppn2/8/3NP3/2N1B3/PPP1BPPP/R2QK2R w KQkq - 0 9", "solution": ["O-O", "Be7", "f4", "O-O", "Qe1", "Nc5", "Qg3"], "difficulty": "impossible", "rating": 2010, "theme": "najdorf_be2"},
        {"puzzle_id": "i027", "fen": "r1bq1rk1/pp1nbppp/2p1pn2/3p4/2PP4/2NBPN2/PP3PPP/R1BQ1RK1 b - - 4 9", "solution": ["a5", "a3", "Ba6", "b3", "Rc8", "Bb2", "c5"], "difficulty": "impossible", "rating": 2120, "theme": "qid_fianchetto"},
        {"puzzle_id": "i028", "fen": "r1bqk2r/pp1nbppp/2p1p3/3p4/2PP4/2NBPN2/PP3PPP/R1BQ1RK1 b kq - 2 8", "solution": ["Ngf6", "O-O", "O-O", "b3", "b6", "Bb2", "Bb7"], "difficulty": "impossible", "rating": 2200, "theme": "qgd_tartakower"},
        {"puzzle_id": "i029", "fen": "r1bq1rk1/ppp1npbp/3p1np1/3Pp3/2P1P3/2N2N2/PP2BPPP/R1BQ1RK1 b - - 0 9", "solution": ["a5", "Bg5", "h6", "Be3", "Ng4", "Bd2", "f5"], "difficulty": "impossible", "rating": 2280, "theme": "ki_saemisch"},
        {"puzzle_id": "i030", "fen": "r1bqk2r/pp1n1ppp/2pbpn2/8/2PP4/2N1PN2/PP3PPP/R1BQKB1R w KQkq - 0 7", "solution": ["Bd3", "O-O", "O-O", "dxc4", "Bxc4", "e5", "dxe5"], "difficulty": "impossible", "rating": 2350, "theme": "slav_exchange"},
        {"puzzle_id": "i031", "fen": "r1bq1rk1/pppnnpbp/3p2p1/3Pp3/2P1P3/2N5/PP2BPPP/R1BQ1RNK w - - 4 11", "solution": ["f4", "exf4", "Bxf4", "Ne5", "Nf3", "f6", "Qb3"], "difficulty": "impossible", "rating": 2400, "theme": "ki_four_pawns"},
        {"puzzle_id": "i032", "fen": "r1bq1rk1/pp1n1pbp/2pp1np1/4p3/2PPP3/2N2N2/PP2BPPP/R1BQ1RK1 w - - 0 9", "solution": ["d5", "c5", "a4", "a5", "Bg5", "h6", "Be3"], "difficulty": "impossible", "rating": 2180, "theme": "old_indian"},
        {"puzzle_id": "i033", "fen": "rnbq1rk1/pp2ppbp/3p1np1/2p5/2PP4/2N2NP1/PP2PP1P/R1BQKB1R w KQ - 0 7", "solution": ["d5", "Na6", "e4", "Nc7", "a4", "a5", "Bf4"], "difficulty": "impossible", "rating": 2260, "theme": "benoni_modern"},
        {"puzzle_id": "i034", "fen": "r1bqk2r/pp1nbppp/2p1pn2/3p4/2PPP3/2N2N2/PP3PPP/R1BQKB1R b KQkq e3 0 6", "solution": ["dxe4", "Nxe4", "Nxe4", "Qxd8+", "Kxd8", "Bxe4", "c5"], "difficulty": "impossible", "rating": 2320, "theme": "caro_kann_panov"},
        {"puzzle_id": "i035", "fen": "r1bq1rk1/pp1nbppp/2p1p3/3pP3/3P4/2NBBN2/PPP2PPP/R2QK2R b KQ - 1 9", "solution": ["c5", "dxc5", "Bxc5", "Bxc5", "Qa5+", "Bd2", "Qxc5"], "difficulty": "impossible", "rating": 2380, "theme": "french_tarrasch"},
        {"puzzle_id": "i036", "fen": "r1bqkb1r/pp3ppp/2n1pn2/2ppP3/3P4/2P2N2/PP3PPP/RNBQKB1R b KQkq - 0 6", "solution": ["Nd7", "a3", "cxd4", "cxd4", "f6", "exf6", "Nxf6"], "difficulty": "impossible", "rating": 2050, "theme": "french_advance_c3"},
        {"puzzle_id": "i037", "fen": "r1bq1rk1/pp2bppp/2n1pn2/2pp4/3P4/1P1BPN2/PBP2PPP/RN1Q1RK1 w - - 0 9", "solution": ["Nbd2", "Qc7", "dxc5", "Bxc5", "c4", "d4", "exd4"], "difficulty": "impossible", "rating": 2150, "theme": "colle_zukertort"},
        {"puzzle_id": "i038", "fen": "r2qk2r/pp1bbppp/2n1pn2/2ppP3/3P4/2P2N2/PP2BPPP/RNBQK2R w KQkq - 2 8", "solution": ["Na3", "cxd4", "cxd4", "Qa5+", "Bd2", "Qb6", "O-O"], "difficulty": "impossible", "rating": 2250, "theme": "french_advance_euwe"},
        {"puzzle_id": "i039", "fen": "r1bq1rk1/pp2npbp/2np2p1/2p1p3/4P3/2PP1NP1/PP1N1PBP/R1BQ1RK1 w - - 0 10", "solution": ["a4", "a5", "Nc4", "f5", "f3", "Be6", "Ba3"], "difficulty": "impossible", "rating": 2330, "theme": "english_botvinnik"},
        {"puzzle_id": "i040", "fen": "r1bqk2r/ppp1bppp/2n1pn2/3p4/2PP4/2N1PN2/PP3PPP/R1BQKB1R w KQkq - 2 6", "solution": ["cxd5", "exd5", "Bd3", "c6", "Qc2", "h6", "O-O"], "difficulty": "impossible", "rating": 2420, "theme": "qgd_exchange_main"},
        
        # More Easy
        {"puzzle_id": "e041", "fen": "rnbqkbnr/ppp2ppp/4p3/3p4/2PP4/8/PP2PPPP/RNBQKBNR w KQkq d6 0 3", "solution": ["Nc3"], "difficulty": "easy", "rating": 420, "theme": "development"},
        {"puzzle_id": "e042", "fen": "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2", "solution": ["Nf3"], "difficulty": "easy", "rating": 410, "theme": "development"},
        {"puzzle_id": "e043", "fen": "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3", "solution": ["d4"], "difficulty": "easy", "rating": 480, "theme": "center_control"},
        {"puzzle_id": "e044", "fen": "rnbqkbnr/ppp2ppp/4p3/3pP3/3P4/8/PPP2PPP/RNBQKBNR b KQkq - 0 3", "solution": ["c5"], "difficulty": "easy", "rating": 500, "theme": "pawn_break"},
        {"puzzle_id": "e045", "fen": "rnbqkb1r/ppp2ppp/4pn2/3p4/3PP3/8/PPP2PPP/RNBQKBNR w KQkq - 0 4", "solution": ["e5"], "difficulty": "easy", "rating": 510, "theme": "advance"},
        {"puzzle_id": "e046", "fen": "rnbqkbnr/pp2pppp/2p5/3p4/3PP3/8/PPP2PPP/RNBQKBNR w KQkq d6 0 3", "solution": ["e5"], "difficulty": "easy", "rating": 490, "theme": "space"},
        {"puzzle_id": "e047", "fen": "r1bqkbnr/pppppppp/2n5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 1 2", "solution": ["d4"], "difficulty": "easy", "rating": 430, "theme": "center_grab"},
        {"puzzle_id": "e048", "fen": "rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3", "solution": ["Nc6"], "difficulty": "easy", "rating": 440, "theme": "development"},
        {"puzzle_id": "e049", "fen": "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4", "solution": ["c3"], "difficulty": "easy", "rating": 500, "theme": "prepare_d4"},
        {"puzzle_id": "e050", "fen": "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3", "solution": ["Be7"], "difficulty": "easy", "rating": 460, "theme": "solid_defense"},
        
        # More Medium
        {"puzzle_id": "m041", "fen": "r1bqkb1r/pppp1ppp/2n2n2/4p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 4 4", "solution": ["d4", "exd4", "Nxd4"], "difficulty": "medium", "rating": 900, "theme": "center_attack"},
        {"puzzle_id": "m042", "fen": "rnbqkb1r/pp2pppp/2p2n2/3p4/2PP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 0 4", "solution": ["e3", "e6", "Nf3"], "difficulty": "medium", "rating": 880, "theme": "solid_setup"},
        {"puzzle_id": "m043", "fen": "rnbqkbnr/ppp2ppp/4p3/3pP3/3P4/8/PPP2PPP/RNBQKBNR b KQkq - 0 3", "solution": ["c5", "c3", "Nc6"], "difficulty": "medium", "rating": 950, "theme": "french_defense"},
        {"puzzle_id": "m044", "fen": "rnbqkb1r/pp2pppp/2p2n2/3p4/2PP4/5N2/PP2PPPP/RNBQKB1R w KQkq - 0 4", "solution": ["Nc3", "e6", "e3"], "difficulty": "medium", "rating": 910, "theme": "slav_main"},
        {"puzzle_id": "m045", "fen": "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/2P2N2/PP1P1PPP/RNBQK2R b KQkq - 0 4", "solution": ["Be7", "d4", "d6"], "difficulty": "medium", "rating": 930, "theme": "quiet_italian"},
        {"puzzle_id": "m046", "fen": "rnbqkb1r/ppp2ppp/4pn2/3p4/2PP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 0 4", "solution": ["Bf4", "c6", "e3"], "difficulty": "medium", "rating": 960, "theme": "london_vs_qgd"},
        {"puzzle_id": "m047", "fen": "r1bqkbnr/pp1ppppp/2n5/2p5/3PP3/5N2/PPP2PPP/RNBQKB1R b KQkq d3 0 3", "solution": ["cxd4", "Nxd4", "e6"], "difficulty": "medium", "rating": 940, "theme": "sicilian_open"},
        {"puzzle_id": "m048", "fen": "rnbqkb1r/pp2pppp/3p1n2/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 4", "solution": ["Nc3", "a6", "d4"], "difficulty": "medium", "rating": 980, "theme": "sicilian_najdorf_start"},
        {"puzzle_id": "m049", "fen": "rnbqkb1r/pppp1ppp/5n2/4p3/4P3/2N5/PPPP1PPP/R1BQKBNR w KQkq - 2 3", "solution": ["Nf3", "Nc6", "d4"], "difficulty": "medium", "rating": 870, "theme": "three_knights"},
        {"puzzle_id": "m050", "fen": "rnbqkb1r/ppp1pppp/5n2/3p4/3P4/5N2/PPP1PPPP/RNBQKB1R w KQkq d6 0 3", "solution": ["c4", "e6", "Nc3"], "difficulty": "medium", "rating": 890, "theme": "queens_pawn"},
        
        # More Hard
        {"puzzle_id": "h041", "fen": "r1bq1rk1/pp1nbppp/2p1p3/3p4/2PP4/2NBPN2/PP3PPP/R1BQ1RK1 b - - 4 9", "solution": ["Nf8", "b3", "Ng6", "Bb2", "Nh4", "Ne1", "f5"], "difficulty": "hard", "rating": 1500, "theme": "caro_kann_karpov"},
        {"puzzle_id": "h042", "fen": "r1bqk2r/pp1nbppp/2p1p3/3pP3/3P4/2N2N2/PPP2PPP/R1BQKB1R b KQkq - 0 7", "solution": ["f6", "Bd3", "Nc5", "Bc2", "fxe5", "dxe5", "O-O"], "difficulty": "hard", "rating": 1540, "theme": "french_rubinstein"},
        {"puzzle_id": "h043", "fen": "r1bqk2r/pp2bppp/2n1pn2/2pp4/3P4/2PBPN2/PP1N1PPP/R1BQK2R b KQkq - 2 7", "solution": ["cxd4", "exd4", "dxc4", "Bxc4", "b5"], "difficulty": "hard", "rating": 1580, "theme": "qid_classical"},
        {"puzzle_id": "h044", "fen": "r1bq1rk1/pp1n1pbp/2pp1np1/4p3/2PPP3/2N2N2/PP2BPPP/R1BQ1RK1 w - - 0 9", "solution": ["d5", "cxd5", "cxd5", "Nc5", "Bg5", "a5", "Nd2"], "difficulty": "hard", "rating": 1620, "theme": "ki_classical_main"},
        {"puzzle_id": "h045", "fen": "rnbqk2r/pp2bppp/2p1pn2/3p4/2PP4/2N2N2/PP2PPPP/R1BQKB1R w KQkq - 2 5", "solution": ["Bf4", "O-O", "e3", "Nbd7", "Bd3"], "difficulty": "hard", "rating": 1560, "theme": "qgd_bf4"},
        {"puzzle_id": "h046", "fen": "r1bq1rk1/ppp1npbp/3p1np1/3Pp3/2P1P3/2N5/PP2BPPP/R1BQ1RNK b - - 3 10", "solution": ["a5", "f3", "Na6", "Be3", "Nc5", "Qd2", "Bd7"], "difficulty": "hard", "rating": 1680, "theme": "ki_saemisch_main"},
        {"puzzle_id": "h047", "fen": "r2qkb1r/pp1n1ppp/2p1pn2/3p4/2PP2b1/2N1PN2/PP3PPP/R1BQKB1R w KQkq - 2 7", "solution": ["Be2", "Bxf3", "Bxf3", "Be7", "O-O"], "difficulty": "hard", "rating": 1550, "theme": "slav_botvinnik"},
        {"puzzle_id": "h048", "fen": "r1bqkb1r/pp1n1ppp/2p1pn2/3p4/2PP4/2N1PN2/PP3PPP/R1BQKB1R w KQkq - 0 6", "solution": ["Bd3", "dxc4", "Bxc4", "b5", "Bd3", "Bb7"], "difficulty": "hard", "rating": 1640, "theme": "meran_main"},
        {"puzzle_id": "h049", "fen": "r1bqk2r/pp1n1ppp/2pbpn2/8/2PP4/2N1PN2/PP3PPP/R1BQKB1R w KQkq - 0 7", "solution": ["Bd3", "O-O", "O-O", "dxc4", "Bxc4", "e5"], "difficulty": "hard", "rating": 1710, "theme": "slav_exchange_main"},
        {"puzzle_id": "h050", "fen": "r1bq1rk1/pp2bppp/2n1pn2/2pp4/3P4/1P1BPN2/PBP2PPP/RN1Q1RK1 b - - 3 8", "solution": ["Qc7", "Nbd2", "cxd4", "exd4", "b6", "a4", "Ba6"], "difficulty": "hard", "rating": 1590, "theme": "colle_main"},
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
    },
    # Additional Openings
    {
        "opening_id": "scotch_game",
        "name": "Scotch Game",
        "eco": "C44-C45",
        "moves": ["e4", "e5", "Nf3", "Nc6", "d4"],
        "fen": "r1bqkbnr/pppp1ppp/2n5/4p3/3PP3/5N2/PPP2PPP/RNBQKB1R b KQkq d3 0 3",
        "description": "Direct central opening leading to open positions.",
        "difficulty": "beginner",
        "category": "open_game",
        "main_ideas": ["Immediate central tension", "Open game", "Active pieces"],
        "famous_games": ["Kasparov vs Karpov 1990"]
    },
    {
        "opening_id": "vienna_game",
        "name": "Vienna Game",
        "eco": "C25-C29",
        "moves": ["e4", "e5", "Nc3"],
        "fen": "rnbqkbnr/pppp1ppp/8/4p3/4P3/2N5/PPPP1PPP/R1BQKBNR b KQkq - 1 2",
        "description": "Flexible opening that can lead to various positions.",
        "difficulty": "intermediate",
        "category": "open_game",
        "main_ideas": ["Flexible development", "f4 push option", "Control center"],
        "famous_games": ["Steinitz games"]
    },
    {
        "opening_id": "pirc_defense",
        "name": "Pirc Defense",
        "eco": "B07-B09",
        "moves": ["e4", "d6", "d4", "Nf6", "Nc3", "g6"],
        "fen": "rnbqkb1r/ppp1pp1p/3p1np1/8/3PP3/2N5/PPP2PPP/R1BQKBNR w KQkq - 0 4",
        "description": "Hypermodern defense allowing White a big center.",
        "difficulty": "intermediate",
        "category": "semi_open",
        "main_ideas": ["Counterattack center", "Kingside fianchetto", "Flexible"],
        "famous_games": ["Pirc's original games"]
    },
    {
        "opening_id": "alekhine_defense",
        "name": "Alekhine Defense",
        "eco": "B02-B05",
        "moves": ["e4", "Nf6"],
        "fen": "rnbqkb1r/pppppppp/5n2/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 1 2",
        "description": "Provocative defense luring White's pawns forward.",
        "difficulty": "advanced",
        "category": "semi_open",
        "main_ideas": ["Provoke pawn advances", "Attack overextended center", "Dynamic play"],
        "famous_games": ["Alekhine's games"]
    },
    {
        "opening_id": "dutch_defense",
        "name": "Dutch Defense",
        "eco": "A80-A99",
        "moves": ["d4", "f5"],
        "fen": "rnbqkbnr/ppppp1pp/8/5p2/3P4/8/PPP1PPPP/RNBQKBNR w KQkq f6 0 2",
        "description": "Aggressive defense aiming for kingside attack.",
        "difficulty": "intermediate",
        "category": "closed_game",
        "main_ideas": ["Kingside attack", "Control e4 square", "Stonewall or Leningrad setup"],
        "famous_games": ["Botvinnik's Dutch games"]
    },
    {
        "opening_id": "benko_gambit",
        "name": "Benko Gambit",
        "eco": "A57-A59",
        "moves": ["d4", "Nf6", "c4", "c5", "d5", "b5"],
        "fen": "rnbqkb1r/p2ppppp/5n2/1ppP4/2P5/8/PP2PPPP/RNBQKBNR w KQkq b6 0 4",
        "description": "Positional gambit for long-term queenside pressure.",
        "difficulty": "advanced",
        "category": "gambit",
        "main_ideas": ["Queenside pressure", "Open a and b files", "Long-term compensation"],
        "famous_games": ["Benko's original games"]
    },
    {
        "opening_id": "catalan_opening",
        "name": "Catalan Opening",
        "eco": "E01-E09",
        "moves": ["d4", "Nf6", "c4", "e6", "g3"],
        "fen": "rnbqkb1r/pppp1ppp/4pn2/8/2PP4/6P1/PP2PP1P/RNBQKBNR b KQkq - 0 3",
        "description": "Positional opening with fianchettoed bishop.",
        "difficulty": "advanced",
        "category": "closed_game",
        "main_ideas": ["Long diagonal pressure", "Positional play", "Squeeze Black"],
        "famous_games": ["Kramnik's Catalan games"]
    },
    {
        "opening_id": "benoni_defense",
        "name": "Benoni Defense",
        "eco": "A60-A79",
        "moves": ["d4", "Nf6", "c4", "c5", "d5"],
        "fen": "rnbqkb1r/pp1ppppp/5n2/2pP4/2P5/8/PP2PPPP/RNBQKBNR b KQkq - 0 3",
        "description": "Dynamic defense creating asymmetrical pawn structure.",
        "difficulty": "advanced",
        "category": "indian_defense",
        "main_ideas": ["Queenside minority", "e6 or e5 break", "Dynamic counterplay"],
        "famous_games": ["Tal vs Petrosian"]
    },
    {
        "opening_id": "trompowsky_attack",
        "name": "Trompowsky Attack",
        "eco": "A45",
        "moves": ["d4", "Nf6", "Bg5"],
        "fen": "rnbqkb1r/pppppppp/5n2/6B1/3P4/8/PPP1PPPP/RN1QKBNR b KQkq - 2 2",
        "description": "Aggressive system avoiding main lines.",
        "difficulty": "intermediate",
        "category": "closed_game",
        "main_ideas": ["Avoid theory", "Pin knight", "Flexible structure"],
        "famous_games": ["Julian Hodgson's games"]
    },
    {
        "opening_id": "bird_opening",
        "name": "Bird's Opening",
        "eco": "A02-A03",
        "moves": ["f4"],
        "fen": "rnbqkbnr/pppppppp/8/8/5P2/8/PPPPP1PP/RNBQKBNR b KQkq f3 0 1",
        "description": "Flank opening controlling e5 with f-pawn.",
        "difficulty": "intermediate",
        "category": "flank",
        "main_ideas": ["Control e5", "Kingside play", "Avoid main lines"],
        "famous_games": ["Bird's original games"]
    },
    {
        "opening_id": "petrov_defense",
        "name": "Petrov Defense (Russian Game)",
        "eco": "C42-C43",
        "moves": ["e4", "e5", "Nf3", "Nf6"],
        "fen": "rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
        "description": "Solid symmetrical defense aiming for equality.",
        "difficulty": "intermediate",
        "category": "open_game",
        "main_ideas": ["Solid equality", "Counterattack e4", "Safe but playable"],
        "famous_games": ["Kramnik's Petrov games"]
    },
    {
        "opening_id": "philidor_defense",
        "name": "Philidor Defense",
        "eco": "C41",
        "moves": ["e4", "e5", "Nf3", "d6"],
        "fen": "rnbqkbnr/ppp2ppp/3p4/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 3",
        "description": "Solid but passive defense, popularized by Philidor.",
        "difficulty": "beginner",
        "category": "open_game",
        "main_ideas": ["Solid structure", "Support e5", "Slow development"],
        "famous_games": ["Philidor's games"]
    },
    {
        "opening_id": "two_knights_defense",
        "name": "Two Knights Defense",
        "eco": "C55-C59",
        "moves": ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6"],
        "fen": "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
        "description": "Sharp defense inviting the Fried Liver Attack.",
        "difficulty": "intermediate",
        "category": "open_game",
        "main_ideas": ["Active defense", "Counterattack", "Sharp play"],
        "famous_games": ["Many Fried Liver games"]
    },
    {
        "opening_id": "najdorf_sicilian",
        "name": "Sicilian Najdorf",
        "eco": "B90-B99",
        "moves": ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6"],
        "fen": "rnbqkb1r/1p2pppp/p2p1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 0 6",
        "description": "The most popular Sicilian, played by Fischer and Kasparov.",
        "difficulty": "advanced",
        "category": "semi_open",
        "main_ideas": ["Flexible structure", "b5 expansion", "Dynamic play"],
        "famous_games": ["Fischer vs Spassky 1972"]
    },
    {
        "opening_id": "dragon_sicilian",
        "name": "Sicilian Dragon",
        "eco": "B70-B79",
        "moves": ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "g6"],
        "fen": "rnbqkb1r/pp2pp1p/3p1np1/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 0 6",
        "description": "Sharp Sicilian with fianchettoed bishop.",
        "difficulty": "advanced",
        "category": "semi_open",
        "main_ideas": ["Long diagonal", "Opposite castling", "Tactical battles"],
        "famous_games": ["Karpov vs Korchnoi 1974"]
    },
    {
        "opening_id": "smith_morra_gambit",
        "name": "Smith-Morra Gambit",
        "eco": "B21",
        "moves": ["e4", "c5", "d4", "cxd4", "c3"],
        "fen": "rnbqkbnr/pp1ppppp/8/8/3pP3/2P5/PP3PPP/RNBQKBNR b KQkq - 0 3",
        "description": "Aggressive gambit against the Sicilian.",
        "difficulty": "intermediate",
        "category": "gambit",
        "main_ideas": ["Rapid development", "Open c-file", "Initiative"],
        "famous_games": ["Ken Smith's games"]
    },
    # More Openings
    {
        "opening_id": "four_knights",
        "name": "Four Knights Game",
        "eco": "C46-C49",
        "moves": ["e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6"],
        "fen": "r1bqkb1r/pppp1ppp/2n2n2/4p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 4 4",
        "description": "Symmetrical opening leading to balanced positions.",
        "difficulty": "beginner",
        "category": "open_game",
        "main_ideas": ["Symmetrical development", "Solid structure", "Early equality"],
        "famous_games": ["Many classical games"]
    },
    {
        "opening_id": "queens_indian",
        "name": "Queen's Indian Defense",
        "eco": "E12-E19",
        "moves": ["d4", "Nf6", "c4", "e6", "Nf3", "b6"],
        "fen": "rnbqkb1r/p1pp1ppp/1p2pn2/8/2PP4/5N2/PP2PPPP/RNBQKB1R w KQkq - 0 4",
        "description": "Flexible defense with queenside fianchetto.",
        "difficulty": "intermediate",
        "category": "indian_defense",
        "main_ideas": ["Control e4", "Queenside fianchetto", "Solid defense"],
        "famous_games": ["Many Karpov games"]
    },
    {
        "opening_id": "modern_defense",
        "name": "Modern Defense",
        "eco": "B06",
        "moves": ["e4", "g6"],
        "fen": "rnbqkbnr/pppppp1p/6p1/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
        "description": "Hypermodern defense with kingside fianchetto.",
        "difficulty": "intermediate",
        "category": "semi_open",
        "main_ideas": ["Delay confrontation", "Fianchetto bishop", "Flexible structure"],
        "famous_games": ["Tiger's Modern games"]
    },
    {
        "opening_id": "kings_fianchetto",
        "name": "King's Fianchetto Opening",
        "eco": "A00",
        "moves": ["g3"],
        "fen": "rnbqkbnr/pppppppp/8/8/8/6P1/PPPPPP1P/RNBQKBNR b KQkq - 0 1",
        "description": "Flexible opening aiming for kingside fianchetto.",
        "difficulty": "beginner",
        "category": "flank",
        "main_ideas": ["Control long diagonal", "Flexible setup", "Safe king"],
        "famous_games": ["Many hypermodern games"]
    },
    {
        "opening_id": "colle_system",
        "name": "Colle System",
        "eco": "D05",
        "moves": ["d4", "d5", "Nf3", "Nf6", "e3"],
        "fen": "rnbqkb1r/ppp1pppp/5n2/3p4/3P4/4PN2/PPP2PPP/RNBQKB1R b KQkq - 0 3",
        "description": "Solid system aiming for e4 break.",
        "difficulty": "beginner",
        "category": "closed_game",
        "main_ideas": ["Solid structure", "e4 pawn break", "Easy to learn"],
        "famous_games": ["Colle's original games"]
    },
    {
        "opening_id": "torre_attack",
        "name": "Torre Attack",
        "eco": "A46",
        "moves": ["d4", "Nf6", "Nf3", "e6", "Bg5"],
        "fen": "rnbqkb1r/pppp1ppp/4pn2/6B1/3P4/5N2/PPP1PPPP/RN1QKB1R b KQkq - 2 3",
        "description": "System opening avoiding main lines.",
        "difficulty": "intermediate",
        "category": "closed_game",
        "main_ideas": ["Pin knight", "Avoid theory", "Flexible setup"],
        "famous_games": ["Torre's games"]
    },
    {
        "opening_id": "tarrasch_defense",
        "name": "Tarrasch Defense",
        "eco": "D32-D34",
        "moves": ["d4", "d5", "c4", "e6", "Nc3", "c5"],
        "fen": "rnbqkbnr/pp3ppp/4p3/2pp4/2PP4/2N5/PP2PPPP/R1BQKBNR w KQkq c6 0 4",
        "description": "Active defense with isolated pawn.",
        "difficulty": "advanced",
        "category": "closed_game",
        "main_ideas": ["Active pieces", "Accept isolated pawn", "Central control"],
        "famous_games": ["Tarrasch's games"]
    },
    {
        "opening_id": "old_indian",
        "name": "Old Indian Defense",
        "eco": "A53-A55",
        "moves": ["d4", "Nf6", "c4", "d6"],
        "fen": "rnbqkb1r/ppp1pppp/3p1n2/8/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3",
        "description": "Solid defense leading to closed positions.",
        "difficulty": "intermediate",
        "category": "indian_defense",
        "main_ideas": ["Solid structure", "e5 break", "Less theory"],
        "famous_games": ["Many classical games"]
    },
    {
        "opening_id": "budapest_gambit",
        "name": "Budapest Gambit",
        "eco": "A51-A52",
        "moves": ["d4", "Nf6", "c4", "e5"],
        "fen": "rnbqkb1r/pppp1ppp/5n2/4p3/2PP4/8/PP2PPPP/RNBQKBNR w KQkq e6 0 3",
        "description": "Sharp gambit aiming for piece activity.",
        "difficulty": "intermediate",
        "category": "gambit",
        "main_ideas": ["Active pieces", "Surprise value", "Tactical play"],
        "famous_games": ["Budapest Gambit games"]
    },
    {
        "opening_id": "stonewall_attack",
        "name": "Stonewall Attack",
        "eco": "D00",
        "moves": ["d4", "d5", "e3", "Nf6", "Bd3", "e6", "f4"],
        "fen": "rnbqkb1r/ppp2ppp/4pn2/3p4/3P1P2/3BP3/PPP3PP/RNBQK1NR b KQkq f3 0 4",
        "description": "Solid pawn structure with kingside attack.",
        "difficulty": "beginner",
        "category": "closed_game",
        "main_ideas": ["Solid pawns", "Kingside attack", "Easy to learn"],
        "famous_games": ["Many amateur games"]
    },
    {
        "opening_id": "blackmar_diemer",
        "name": "Blackmar-Diemer Gambit",
        "eco": "D00",
        "moves": ["d4", "d5", "e4", "dxe4", "Nc3"],
        "fen": "rnbqkbnr/ppp1pppp/8/8/3Pp3/2N5/PPP2PPP/R1BQKBNR b KQkq - 1 3",
        "description": "Aggressive gambit for rapid development.",
        "difficulty": "intermediate",
        "category": "gambit",
        "main_ideas": ["Fast development", "Open lines", "Attack"],
        "famous_games": ["BDG thematic games"]
    },
    {
        "opening_id": "ponziani",
        "name": "Ponziani Opening",
        "eco": "C44",
        "moves": ["e4", "e5", "Nf3", "Nc6", "c3"],
        "fen": "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/2P2N2/PP1P1PPP/RNBQKB1R b KQkq - 0 3",
        "description": "Solid opening preparing d4.",
        "difficulty": "beginner",
        "category": "open_game",
        "main_ideas": ["Prepare d4", "Solid center", "Less theory"],
        "famous_games": ["Classical games"]
    },
    {
        "opening_id": "scheveningen",
        "name": "Sicilian Scheveningen",
        "eco": "B80-B89",
        "moves": ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "e6"],
        "fen": "rnbqkb1r/pp3ppp/3ppn2/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 0 6",
        "description": "Flexible Sicilian with small center.",
        "difficulty": "advanced",
        "category": "semi_open",
        "main_ideas": ["Flexible pawn structure", "d5 or e5 breaks", "Rich middlegame"],
        "famous_games": ["Kasparov's Scheveningen games"]
    },
    {
        "opening_id": "accelerated_dragon",
        "name": "Sicilian Accelerated Dragon",
        "eco": "B34-B39",
        "moves": ["e4", "c5", "Nf3", "Nc6", "d4", "cxd4", "Nxd4", "g6"],
        "fen": "r1bqkbnr/pp1ppp1p/2n3p1/8/3NP3/8/PPP2PPP/RNBQKB1R w KQkq - 0 5",
        "description": "Early fianchetto avoiding the Yugoslav Attack.",
        "difficulty": "intermediate",
        "category": "semi_open",
        "main_ideas": ["Quick fianchetto", "Avoid Yugoslav Attack", "Maroczy Bind risk"],
        "famous_games": ["Many modern games"]
    },
    {
        "opening_id": "nimzowitsch_defense",
        "name": "Nimzowitsch Defense",
        "eco": "B00",
        "moves": ["e4", "Nc6"],
        "fen": "r1bqkbnr/pppppppp/2n5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 1 2",
        "description": "Hypermodern approach, controlling center from the flank.",
        "difficulty": "intermediate",
        "category": "semi_open",
        "main_ideas": ["Hypermodern center control", "Flexible structure", "Surprise value"],
        "famous_games": ["Nimzowitsch's original games"]
    },
    {
        "opening_id": "owen_defense",
        "name": "Owen's Defense",
        "eco": "B00",
        "moves": ["e4", "b6"],
        "fen": "rnbqkbnr/p1pppppp/1p6/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
        "description": "Fianchetto the bishop to b7 to challenge e4.",
        "difficulty": "beginner",
        "category": "semi_open",
        "main_ideas": ["Fianchetto bishop", "Pressure on e4", "Quiet development"],
        "famous_games": ["Owen vs Burn 1887"]
    },
    {
        "opening_id": "latvian_gambit",
        "name": "Latvian Gambit",
        "eco": "C40",
        "moves": ["e4", "e5", "Nf3", "f5"],
        "fen": "rnbqkbnr/pppp2pp/8/4pp2/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq f6 0 3",
        "description": "A sharp and risky gambit for Black seeking counterplay.",
        "difficulty": "advanced",
        "category": "open_game",
        "main_ideas": ["Sharp counterattack", "f-file play", "High risk high reward"],
        "famous_games": ["Romantic era games"]
    },
    {
        "opening_id": "danish_gambit",
        "name": "Danish Gambit",
        "eco": "C21",
        "moves": ["e4", "e5", "d4", "exd4", "c3"],
        "fen": "rnbqkbnr/pppp1ppp/8/8/3pP3/2P5/PP3PPP/RNBQKBNR b KQkq - 0 3",
        "description": "White sacrifices pawns for rapid development and attack.",
        "difficulty": "intermediate",
        "category": "gambit",
        "main_ideas": ["Rapid development", "Open lines", "Attacking chances"],
        "famous_games": ["From's era gambit games"]
    },
    {
        "opening_id": "center_game",
        "name": "Center Game",
        "eco": "C22",
        "moves": ["e4", "e5", "d4", "exd4", "Qxd4"],
        "fen": "rnbqkbnr/pppp1ppp/8/8/3QP3/8/PPP2PPP/RNB1KBNR b KQkq - 0 3",
        "description": "White immediately recaptures in the center but exposes the queen.",
        "difficulty": "beginner",
        "category": "open_game",
        "main_ideas": ["Central control", "Early queen development", "Tempo loss risk"],
        "famous_games": ["Historic center game miniatures"]
    },
    {
        "opening_id": "giuoco_piano",
        "name": "Giuoco Piano",
        "eco": "C53-C54",
        "moves": ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5"],
        "fen": "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
        "description": "The Quiet Game - solid Italian setup with symmetrical development.",
        "difficulty": "beginner",
        "category": "open_game",
        "main_ideas": ["Solid development", "Control d4", "Prepare c3 and d4"],
        "famous_games": ["Morphy era games"]
    },
    {
        "opening_id": "fried_liver",
        "name": "Fried Liver Attack",
        "eco": "C57",
        "moves": ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "Ng5", "d5", "exd5", "Nxd5", "Nxf7"],
        "fen": "r1bqkb1r/ppp2Npp/2n5/3np3/2B5/8/PPPP1PPP/RNBQK2R b KQkq - 0 7",
        "description": "Aggressive knight sacrifice on f7 targeting the black king.",
        "difficulty": "intermediate",
        "category": "gambit",
        "main_ideas": ["Knight sacrifice on f7", "Expose the king", "Tactical fireworks"],
        "famous_games": ["Polerio's famous analysis"]
    },
    {
        "opening_id": "max_lange",
        "name": "Max Lange Attack",
        "eco": "C55-C56",
        "moves": ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "d4", "exd4", "O-O"],
        "fen": "r1bqkb1r/pppp1ppp/2n2n2/8/2BpP3/5N2/PPP2PPP/RNBQ1RK1 b kq - 1 5",
        "description": "Sacrificial gambit offering d4 pawn for rapid piece development.",
        "difficulty": "advanced",
        "category": "gambit",
        "main_ideas": ["Sacrifice for development", "Open lines", "Attack the king"],
        "famous_games": ["Max Lange vs Schierstedt 1856"]
    },
    {
        "opening_id": "halloween_gambit",
        "name": "Halloween Gambit",
        "eco": "C47",
        "moves": ["e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6", "Nxe5"],
        "fen": "r1bqkb1r/pppp1ppp/2n2n2/4N3/4P3/2N5/PPPP1PPP/R1BQKB1R b KQkq - 0 4",
        "description": "Wild knight sacrifice aiming for rapid central dominance.",
        "difficulty": "intermediate",
        "category": "gambit",
        "main_ideas": ["Knight sacrifice for center control", "d4 push", "Aggressive play"],
        "famous_games": ["Brause games on ICC"]
    },
    {
        "opening_id": "vienna_gambit",
        "name": "Vienna Gambit",
        "eco": "C29",
        "moves": ["e4", "e5", "Nc3", "Nf6", "f4"],
        "fen": "rnbqkb1r/pppp1ppp/5n2/4p3/4PP2/2N5/PPPP2PP/R1BQKBNR b KQkq f3 0 3",
        "description": "Gambit version of the Vienna Game with f4.",
        "difficulty": "intermediate",
        "category": "gambit",
        "main_ideas": ["Open f-file", "Center pressure", "Kingside attack"],
        "famous_games": ["Romantic era classics"]
    },
    {
        "opening_id": "bishop_opening",
        "name": "Bishop's Opening",
        "eco": "C23-C24",
        "moves": ["e4", "e5", "Bc4"],
        "fen": "rnbqkbnr/pppp1ppp/8/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR b KQkq - 1 2",
        "description": "Early bishop development to c4, a flexible setup.",
        "difficulty": "beginner",
        "category": "open_game",
        "main_ideas": ["Target f7", "Flexible setup", "Transpose to other openings"],
        "famous_games": ["Various classical games"]
    },
    {
        "opening_id": "portuguese_gambit",
        "name": "Portuguese Gambit (Scandinavian)",
        "eco": "B01",
        "moves": ["e4", "d5", "exd5", "Nf6", "d4", "Bg4"],
        "fen": "rn1qkb1r/ppp1pppp/5n2/3P4/3P2b1/8/PPP2PPP/RNBQKBNR w KQkq - 1 4",
        "description": "Aggressive Scandinavian line with bishop pin.",
        "difficulty": "intermediate",
        "category": "semi_open",
        "main_ideas": ["Pin the queen", "Active piece play", "Gambit the pawn"],
        "famous_games": ["Portuguese Grandmaster games"]
    },
    {
        "opening_id": "alapin_sicilian",
        "name": "Sicilian Alapin (c3 Sicilian)",
        "eco": "B22",
        "moves": ["e4", "c5", "c3"],
        "fen": "rnbqkbnr/pp1ppppp/8/2p5/4P3/2P5/PP1P1PPP/RNBQKBNR b KQkq - 0 2",
        "description": "White prepares d4 with c3, avoiding main Sicilian theory.",
        "difficulty": "intermediate",
        "category": "semi_open",
        "main_ideas": ["Prepare d4", "Simpler positions", "Avoid theory"],
        "famous_games": ["Sveshnikov's games with Alapin"]
    },
    {
        "opening_id": "kan_sicilian",
        "name": "Sicilian Kan (Paulsen)",
        "eco": "B41-B42",
        "moves": ["e4", "c5", "Nf3", "e6", "d4", "cxd4", "Nxd4", "a6"],
        "fen": "rnbqkbnr/1p1p1ppp/p3p3/8/3NP3/8/PPP2PPP/RNBQKB1R w KQkq - 0 5",
        "description": "Flexible Sicilian with early a6, allowing various setups.",
        "difficulty": "intermediate",
        "category": "semi_open",
        "main_ideas": ["Flexible structure", "b5 expansion", "Multiple piece setups"],
        "famous_games": ["Anand's Kan games"]
    },
    {
        "opening_id": "taimanov_sicilian",
        "name": "Sicilian Taimanov",
        "eco": "B44-B49",
        "moves": ["e4", "c5", "Nf3", "e6", "d4", "cxd4", "Nxd4", "Nc6"],
        "fen": "r1bqkbnr/pp1p1ppp/2n1p3/8/3NP3/8/PPP2PPP/RNBQKB1R w KQkq - 1 5",
        "description": "Dynamic Sicilian system favored by many GMs.",
        "difficulty": "advanced",
        "category": "semi_open",
        "main_ideas": ["Central flexibility", "e5 or d5 breaks", "Rich middlegame"],
        "famous_games": ["Taimanov's original games"]
    },
    {
        "opening_id": "sveshnikov_sicilian",
        "name": "Sicilian Sveshnikov",
        "eco": "B33",
        "moves": ["e4", "c5", "Nf3", "Nc6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "e5"],
        "fen": "r1bqkb1r/pp1p1ppp/2n2n2/4p3/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 0 6",
        "description": "Aggressive system with e5, accepting a backward d-pawn.",
        "difficulty": "advanced",
        "category": "semi_open",
        "main_ideas": ["Active piece play", "Accept structural weakness", "Counterattack"],
        "famous_games": ["Sveshnikov's lifetime work"]
    },
    {
        "opening_id": "closed_sicilian",
        "name": "Closed Sicilian",
        "eco": "B23-B26",
        "moves": ["e4", "c5", "Nc3", "Nc6", "g3"],
        "fen": "r1bqkbnr/pp1ppppp/2n5/2p5/4P3/2N3P1/PPPP1P1P/R1BQKBNR b KQkq - 0 3",
        "description": "White avoids open Sicilian complications with g3 setup.",
        "difficulty": "intermediate",
        "category": "semi_open",
        "main_ideas": ["Fianchetto setup", "f4 push", "Positional play"],
        "famous_games": ["Spassky's Closed Sicilian games"]
    },
    {
        "opening_id": "rossolimo_sicilian",
        "name": "Sicilian Rossolimo",
        "eco": "B30-B31",
        "moves": ["e4", "c5", "Nf3", "Nc6", "Bb5"],
        "fen": "r1bqkbnr/pp1ppppp/2n5/1Bp5/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3",
        "description": "Anti-Sicilian with Bb5 pin, avoiding theoretical lines.",
        "difficulty": "intermediate",
        "category": "semi_open",
        "main_ideas": ["Pin the knight", "Avoid main lines", "Positional pressure"],
        "famous_games": ["Rossolimo's original games"]
    },
    {
        "opening_id": "grand_prix_attack",
        "name": "Grand Prix Attack",
        "eco": "B21",
        "moves": ["e4", "c5", "f4"],
        "fen": "rnbqkbnr/pp1ppppp/8/2p5/4PP2/8/PPPP2PP/RNBQKBNR b KQkq f3 0 2",
        "description": "Aggressive anti-Sicilian with early f4.",
        "difficulty": "intermediate",
        "category": "semi_open",
        "main_ideas": ["Kingside attack", "f5 push", "Aggressive play"],
        "famous_games": ["Grand Prix tournament games"]
    },
    {
        "opening_id": "winawer_french",
        "name": "French Winawer Variation",
        "eco": "C15-C19",
        "moves": ["e4", "e6", "d4", "d5", "Nc3", "Bb4"],
        "fen": "rnbqk1nr/ppp2ppp/4p3/3p4/1b1PP3/2N5/PPP2PPP/R1BQKBNR w KQkq - 2 4",
        "description": "The sharpest French Defense variation with Bb4 pin.",
        "difficulty": "advanced",
        "category": "semi_open",
        "main_ideas": ["Pin the knight", "Pawn chain battle", "Structural imbalance"],
        "famous_games": ["Botvinnik's Winawer games"]
    },
    {
        "opening_id": "advance_french",
        "name": "French Advance Variation",
        "eco": "C02",
        "moves": ["e4", "e6", "d4", "d5", "e5"],
        "fen": "rnbqkbnr/ppp2ppp/4p3/3pP3/3P4/8/PPP2PPP/RNBQKBNR b KQkq - 0 3",
        "description": "White gains space with e5, creating a pawn chain.",
        "difficulty": "intermediate",
        "category": "semi_open",
        "main_ideas": ["Space advantage", "Pawn chain", "Kingside attack"],
        "famous_games": ["Nimzowitsch's advance games"]
    },
    {
        "opening_id": "exchange_french",
        "name": "French Exchange Variation",
        "eco": "C01",
        "moves": ["e4", "e6", "d4", "d5", "exd5", "exd5"],
        "fen": "rnbqkbnr/ppp2ppp/8/3p4/3P4/8/PPP2PPP/RNBQKBNR w KQkq - 0 4",
        "description": "Symmetrical pawn structure with equal chances.",
        "difficulty": "beginner",
        "category": "semi_open",
        "main_ideas": ["Symmetrical structure", "Simple positions", "Minority attack"],
        "famous_games": ["Classical exchange games"]
    },
    {
        "opening_id": "caro_kann_advance",
        "name": "Caro-Kann Advance Variation",
        "eco": "B12",
        "moves": ["e4", "c6", "d4", "d5", "e5"],
        "fen": "rnbqkbnr/pp2pppp/2p5/3pP3/3P4/8/PPP2PPP/RNBQKBNR b KQkq - 0 3",
        "description": "White gains space, similar to French Advance but with c6.",
        "difficulty": "intermediate",
        "category": "semi_open",
        "main_ideas": ["Space advantage", "Restrict Black's pieces", "Kingside expansion"],
        "famous_games": ["Short vs Karpov 1992"]
    },
    {
        "opening_id": "caro_kann_classical",
        "name": "Caro-Kann Classical Variation",
        "eco": "B18-B19",
        "moves": ["e4", "c6", "d4", "d5", "Nc3", "dxe4", "Nxe4", "Bf5"],
        "fen": "rn1qkbnr/pp2pppp/2p5/5b2/3PN3/8/PPP2PPP/R1BQKBNR w KQkq - 1 5",
        "description": "The main line of the Caro-Kann with Bf5 development.",
        "difficulty": "intermediate",
        "category": "semi_open",
        "main_ideas": ["Develop bishop before e6", "Solid structure", "Endgame advantage"],
        "famous_games": ["Karpov's many Caro-Kann games"]
    },
    {
        "opening_id": "fantasy_caro_kann",
        "name": "Caro-Kann Fantasy Variation",
        "eco": "B12",
        "moves": ["e4", "c6", "d4", "d5", "f3"],
        "fen": "rnbqkbnr/pp2pppp/2p5/3p4/3PP3/5P2/PPP3PP/RNBQKBNR b KQkq - 0 3",
        "description": "Aggressive setup supporting e4 with f3.",
        "difficulty": "intermediate",
        "category": "semi_open",
        "main_ideas": ["Support e4", "Aggressive center", "f4 expansion"],
        "famous_games": ["Fantasy variation thematic games"]
    },
    {
        "opening_id": "semi_slav",
        "name": "Semi-Slav Defense",
        "eco": "D43-D49",
        "moves": ["d4", "d5", "c4", "c6", "Nf3", "Nf6", "Nc3", "e6"],
        "fen": "rnbqkb1r/pp3ppp/2p1pn2/3p4/2PP4/2N2N2/PP3PPP/R1BQKB1R w KQkq - 0 5",
        "description": "Solid hybrid of Slav and Queen's Gambit Declined.",
        "difficulty": "advanced",
        "category": "closed_game",
        "main_ideas": ["Solid structure", "e5 or dxc4 breaks", "Rich theory"],
        "famous_games": ["Meran and Anti-Meran systems"]
    },
    {
        "opening_id": "meran_variation",
        "name": "Semi-Slav Meran Variation",
        "eco": "D47-D49",
        "moves": ["d4", "d5", "c4", "c6", "Nf3", "Nf6", "Nc3", "e6", "e3", "Nbd7", "Bd3", "dxc4", "Bxc4", "b5"],
        "fen": "r1bqkb1r/p2n1ppp/2p1pn2/1p6/2BP4/2N1PN2/PP3PPP/R1BQK2R w KQkq b6 0 8",
        "description": "Dynamic b5 push creating queenside counterplay.",
        "difficulty": "advanced",
        "category": "closed_game",
        "main_ideas": ["Queenside expansion", "b5-b4 push", "Active piece play"],
        "famous_games": ["Kramnik's Meran games"]
    },
    {
        "opening_id": "qgd_orthodox",
        "name": "Queen's Gambit Declined Orthodox",
        "eco": "D60-D69",
        "moves": ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Be7", "e3", "O-O", "Nf3"],
        "fen": "rnbq1rk1/ppp1bppp/4pn2/3p2B1/2PP4/2N1PN2/PP3PPP/R2QKB1R b KQ - 3 6",
        "description": "Classical QGD setup with the Orthodox defense.",
        "difficulty": "intermediate",
        "category": "closed_game",
        "main_ideas": ["Solid structure", "Minority attack", "Classical play"],
        "famous_games": ["Capablanca's QGD games"]
    },
    {
        "opening_id": "qgd_ragozin",
        "name": "Ragozin Defense",
        "eco": "D38-D39",
        "moves": ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Nf3", "Bb4"],
        "fen": "rnbqk2r/ppp2ppp/4pn2/3p4/1bPP4/2N2N2/PP3PPP/R1BQKB1R w KQkq - 4 5",
        "description": "Active defense combining QGD and Nimzo-Indian ideas.",
        "difficulty": "advanced",
        "category": "closed_game",
        "main_ideas": ["Active piece play", "Pin the knight", "Dynamic positions"],
        "famous_games": ["Ragozin's original games"]
    },
    {
        "opening_id": "qga",
        "name": "Queen's Gambit Accepted",
        "eco": "D20-D29",
        "moves": ["d4", "d5", "c4", "dxc4"],
        "fen": "rnbqkbnr/ppp1pppp/8/8/2pP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3",
        "description": "Black accepts the gambit pawn and tries to hold it or equalize.",
        "difficulty": "intermediate",
        "category": "closed_game",
        "main_ideas": ["Accept the pawn", "Active development", "Counter in center"],
        "famous_games": ["Kasparov's QGA games"]
    },
    {
        "opening_id": "chigorin_defense",
        "name": "Chigorin Defense",
        "eco": "D07",
        "moves": ["d4", "d5", "c4", "Nc6"],
        "fen": "r1bqkbnr/ppp1pppp/2n5/3p4/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 1 3",
        "description": "Unusual defense developing the knight before the bishop.",
        "difficulty": "intermediate",
        "category": "closed_game",
        "main_ideas": ["Knight development", "Piece activity", "Dynamic play"],
        "famous_games": ["Chigorin vs Tarrasch matches"]
    },
    {
        "opening_id": "albin_countergambit",
        "name": "Albin Countergambit",
        "eco": "D08-D09",
        "moves": ["d4", "d5", "c4", "e5"],
        "fen": "rnbqkbnr/ppp2ppp/8/3pp3/2PP4/8/PP2PPPP/RNBQKBNR w KQkq e6 0 3",
        "description": "Sharp countergambit trying to seize the initiative.",
        "difficulty": "intermediate",
        "category": "gambit",
        "main_ideas": ["Counter in center", "e4 push", "Lasker trap"],
        "famous_games": ["Games featuring the Lasker Trap"]
    },
    {
        "opening_id": "marshall_defense",
        "name": "Marshall Defense (QGD)",
        "eco": "D06",
        "moves": ["d4", "d5", "c4", "Nf6"],
        "fen": "rnbqkb1r/ppp1pppp/5n2/3p4/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 1 3",
        "description": "Rare but playable defense with Nf6 before e6.",
        "difficulty": "intermediate",
        "category": "closed_game",
        "main_ideas": ["Flexible setup", "Avoid main QGD lines", "Surprise value"],
        "famous_games": ["Marshall's original ideas"]
    },
    {
        "opening_id": "kings_indian_classical",
        "name": "King's Indian Classical Variation",
        "eco": "E92-E99",
        "moves": ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "Nf3", "O-O", "Be2"],
        "fen": "rnbq1rk1/ppp1ppbp/3p1np1/8/2PPP3/2N2N2/PP2BPPP/R1BQK2R b KQ - 3 6",
        "description": "The main classical line of the King's Indian.",
        "difficulty": "advanced",
        "category": "indian_defense",
        "main_ideas": ["e5 break", "Kingside attack", "f5-f4 pawn storm"],
        "famous_games": ["Fischer vs Spassky 1992 Game 1"]
    },
    {
        "opening_id": "kings_indian_samisch",
        "name": "King's Indian Samisch Variation",
        "eco": "E80-E89",
        "moves": ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "f3"],
        "fen": "rnbqk2r/ppp1ppbp/3p1np1/8/2PPP3/2N2P2/PP4PP/R1BQKBNR b KQkq - 0 5",
        "description": "Aggressive setup with f3, supporting the center and planning Be3.",
        "difficulty": "advanced",
        "category": "indian_defense",
        "main_ideas": ["Massive center", "Be3 setup", "Queenside castling option"],
        "famous_games": ["Petrosian's Samisch games"]
    },
    {
        "opening_id": "kings_indian_four_pawns",
        "name": "King's Indian Four Pawns Attack",
        "eco": "E76-E79",
        "moves": ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "f4"],
        "fen": "rnbqk2r/ppp1ppbp/3p1np1/8/2PPPP2/2N5/PP4PP/R1BQKBNR b KQkq f3 0 5",
        "description": "Ultra-aggressive with four center pawns.",
        "difficulty": "advanced",
        "category": "indian_defense",
        "main_ideas": ["Maximum center control", "Aggressive expansion", "Space advantage"],
        "famous_games": ["Various four pawns attack battles"]
    },
    {
        "opening_id": "nimzo_indian_classical",
        "name": "Nimzo-Indian Classical (Capablanca)",
        "eco": "E32",
        "moves": ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4", "Qc2"],
        "fen": "rnbqk2r/pppp1ppp/4pn2/8/1bPP4/2N5/PPQ1PPPP/R1B1KBNR b KQkq - 3 4",
        "description": "White avoids doubled pawns with Qc2.",
        "difficulty": "advanced",
        "category": "indian_defense",
        "main_ideas": ["Avoid doubled pawns", "Prepare e4", "Positional play"],
        "famous_games": ["Capablanca's original concept"]
    },
    {
        "opening_id": "nimzo_indian_rubinstein",
        "name": "Nimzo-Indian Rubinstein",
        "eco": "E40-E59",
        "moves": ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4", "e3"],
        "fen": "rnbqk2r/pppp1ppp/4pn2/8/1bPP4/2N1P3/PP3PPP/R1BQKBNR b KQkq - 0 4",
        "description": "Solid system accepting the doubled pawns possibility.",
        "difficulty": "intermediate",
        "category": "indian_defense",
        "main_ideas": ["Solid center", "Bishop pair potential", "Slow but strong"],
        "famous_games": ["Rubinstein's games"]
    },
    {
        "opening_id": "bogo_indian",
        "name": "Bogo-Indian Defense",
        "eco": "E11",
        "moves": ["d4", "Nf6", "c4", "e6", "Nf3", "Bb4+"],
        "fen": "rnbqk2r/pppp1ppp/4pn2/8/1bPP4/5N2/PP2PPPP/RNBQKB1R w KQkq - 2 4",
        "description": "Related to Nimzo-Indian, checking on b4 after Nf3.",
        "difficulty": "intermediate",
        "category": "indian_defense",
        "main_ideas": ["Check and trade bishop", "Solid setup", "Flexible"],
        "famous_games": ["Bogoljubow's original games"]
    },
    {
        "opening_id": "grunfeld_exchange",
        "name": "Grunfeld Exchange Variation",
        "eco": "D85-D89",
        "moves": ["d4", "Nf6", "c4", "g6", "Nc3", "d5", "cxd5", "Nxd5", "e4", "Nxc3", "bxc3"],
        "fen": "rnbqkb1r/ppp1pp1p/6p1/8/3PP3/2P5/P4PPP/R1BQKBNR b KQkq - 0 6",
        "description": "The main theoretical battleground of the Grunfeld.",
        "difficulty": "advanced",
        "category": "indian_defense",
        "main_ideas": ["Central pawn mass", "White center vs Black piece activity", "Dynamic balance"],
        "famous_games": ["Kasparov's Grunfeld masterpieces"]
    },
    {
        "opening_id": "grunfeld_russian",
        "name": "Grunfeld Russian System",
        "eco": "D97",
        "moves": ["d4", "Nf6", "c4", "g6", "Nc3", "d5", "Nf3", "Bg7", "Qb3"],
        "fen": "rnbqk2r/ppp1ppbp/5np1/3p4/2PP4/1QN2N2/PP2PPPP/R1B1KB1R b KQkq - 3 5",
        "description": "White pressures d5 with the queen from b3.",
        "difficulty": "advanced",
        "category": "indian_defense",
        "main_ideas": ["Pressure d5", "Quick development", "Tactical complications"],
        "famous_games": ["Russian Grunfeld school games"]
    },
    {
        "opening_id": "dutch_stonewall",
        "name": "Dutch Stonewall",
        "eco": "A83-A84",
        "moves": ["d4", "f5", "c4", "Nf6", "g3", "e6", "Bg2", "d5"],
        "fen": "rnbqkb1r/ppp3pp/4pn2/3p1p2/2PP4/6P1/PP2PPBP/RNBQK1NR w KQkq d6 0 5",
        "description": "Solid pawn wall on light squares with e6-d5-f5.",
        "difficulty": "intermediate",
        "category": "closed_game",
        "main_ideas": ["Stonewall formation", "Kingside attack", "e4 square control"],
        "famous_games": ["Botvinnik's Stonewall games"]
    },
    {
        "opening_id": "dutch_leningrad",
        "name": "Dutch Leningrad Variation",
        "eco": "A87-A89",
        "moves": ["d4", "f5", "c4", "Nf6", "g3", "g6", "Bg2", "Bg7"],
        "fen": "rnbqk2r/ppp1p1bp/5np1/5p2/2PP4/6P1/PP2PPBP/RNBQK1NR w KQkq - 2 5",
        "description": "Combining Dutch f5 with King's Indian fianchetto.",
        "difficulty": "advanced",
        "category": "closed_game",
        "main_ideas": ["Fianchetto both sides", "e5 push", "Dynamic piece play"],
        "famous_games": ["Nakamura's Leningrad games"]
    },
    {
        "opening_id": "english_symmetrical",
        "name": "English Symmetrical Variation",
        "eco": "A30-A39",
        "moves": ["c4", "c5"],
        "fen": "rnbqkbnr/pp1ppppp/8/2p5/2P5/8/PP1PPPPP/RNBQKBNR w KQkq c6 0 2",
        "description": "Symmetrical structure after 1.c4 c5.",
        "difficulty": "intermediate",
        "category": "flank",
        "main_ideas": ["Symmetrical play", "Hedgehog setup", "Maroczy Bind"],
        "famous_games": ["Karpov's English games"]
    },
    {
        "opening_id": "english_four_knights",
        "name": "English Four Knights",
        "eco": "A28-A29",
        "moves": ["c4", "e5", "Nc3", "Nf6", "Nf3", "Nc6"],
        "fen": "r1bqkb1r/pppp1ppp/2n2n2/4p3/2P5/2N2N2/PP1PPPPP/R1BQKB1R w KQkq - 4 4",
        "description": "English version of the Four Knights with flank pressure.",
        "difficulty": "intermediate",
        "category": "flank",
        "main_ideas": ["Flank approach", "d4 preparation", "Flexible center"],
        "famous_games": ["Botvinnik's English games"]
    },
    {
        "opening_id": "english_reversed_sicilian",
        "name": "English Reversed Sicilian",
        "eco": "A20-A26",
        "moves": ["c4", "e5"],
        "fen": "rnbqkbnr/pppp1ppp/8/4p3/2P5/8/PP1PPPPP/RNBQKBNR w KQkq e6 0 2",
        "description": "White plays a Sicilian with an extra tempo.",
        "difficulty": "intermediate",
        "category": "flank",
        "main_ideas": ["Extra tempo Sicilian", "g3 fianchetto", "Flexible development"],
        "famous_games": ["Fischer's Reversed Sicilian"]
    },
    {
        "opening_id": "reti_kings_indian_attack",
        "name": "Reti / King's Indian Attack",
        "eco": "A05-A06",
        "moves": ["Nf3", "d5", "g3", "Nf6", "Bg2"],
        "fen": "rnbqkb1r/ppp1pppp/5n2/3p4/8/5NP1/PPPPPPBP/RNBQK2R b KQkq - 2 3",
        "description": "Flexible system that can transpose into many positions.",
        "difficulty": "intermediate",
        "category": "flank",
        "main_ideas": ["Flexible system", "KIA setup", "Transpose options"],
        "famous_games": ["Fischer's KIA games"]
    },
    {
        "opening_id": "larsen_opening",
        "name": "Larsen's Opening",
        "eco": "A01",
        "moves": ["b3"],
        "fen": "rnbqkbnr/pppppppp/8/8/8/1P6/P1PPPPPP/RNBQKBNR b KQkq - 0 1",
        "description": "Hypermodern first move, fianchettoing the queenside bishop.",
        "difficulty": "intermediate",
        "category": "flank",
        "main_ideas": ["Queenside fianchetto", "Flexible", "Hypermodern approach"],
        "famous_games": ["Larsen vs Spassky 1970 (loss in 17 moves!)"]
    },
    {
        "opening_id": "sokolsky_opening",
        "name": "Sokolsky Opening (Polish)",
        "eco": "A00",
        "moves": ["b4"],
        "fen": "rnbqkbnr/pppppppp/8/8/1P6/8/P1PPPPPP/RNBQKBNR b KQkq b3 0 1",
        "description": "Unusual first move grabbing queenside space.",
        "difficulty": "beginner",
        "category": "flank",
        "main_ideas": ["Queenside space", "Surprise value", "Unusual positions"],
        "famous_games": ["Sokolsky's original games"]
    },
    {
        "opening_id": "grob_attack",
        "name": "Grob's Attack",
        "eco": "A00",
        "moves": ["g4"],
        "fen": "rnbqkbnr/pppppppp/8/8/6P1/8/PPPPPP1P/RNBQKBNR b KQkq g3 0 1",
        "description": "Eccentric opening weakening the kingside immediately.",
        "difficulty": "beginner",
        "category": "flank",
        "main_ideas": ["Surprise", "Unorthodox play", "Psychological weapon"],
        "famous_games": ["Grob's games and Basman's games"]
    },
    {
        "opening_id": "kings_english",
        "name": "King's English",
        "eco": "A20",
        "moves": ["c4", "e5", "g3"],
        "fen": "rnbqkbnr/pppp1ppp/8/4p3/2P5/6P1/PP1PPP1P/RNBQKBNR b KQkq - 0 2",
        "description": "English with fianchetto setup against e5.",
        "difficulty": "intermediate",
        "category": "flank",
        "main_ideas": ["Fianchetto", "Control d5", "Flexible structure"],
        "famous_games": ["Kasparov's English games"]
    },
    {
        "opening_id": "london_with_bf4",
        "name": "London System (Bf4 line)",
        "eco": "D02",
        "moves": ["d4", "d5", "Bf4"],
        "fen": "rnbqkbnr/ppp1pppp/8/3p4/3P1B2/8/PPP1PPPP/RN1QKBNR b KQkq - 1 2",
        "description": "The popular London with early Bf4.",
        "difficulty": "beginner",
        "category": "closed_game",
        "main_ideas": ["Solid setup", "Avoid theory", "Easy to learn"],
        "famous_games": ["Kamsky's London games"]
    },
    {
        "opening_id": "jobava_london",
        "name": "Jobava London",
        "eco": "D00",
        "moves": ["d4", "d5", "Bf4", "Nf6", "Nc3"],
        "fen": "rnbqkb1r/ppp1pppp/5n2/3p4/3P1B2/2N5/PPP1PPPP/R2QKBNR b KQkq - 2 3",
        "description": "Modern aggressive London with Nc3 instead of Nf3.",
        "difficulty": "intermediate",
        "category": "closed_game",
        "main_ideas": ["Aggressive London", "Nc3 development", "e4 push"],
        "famous_games": ["Jobava's original games"]
    },
    {
        "opening_id": "veresov_attack",
        "name": "Veresov Attack",
        "eco": "D01",
        "moves": ["d4", "d5", "Nc3", "Nf6", "Bg5"],
        "fen": "rnbqkb1r/ppp1pppp/5n2/3p2B1/3P4/2N5/PPP1PPPP/R2QKBNR b KQkq - 2 3",
        "description": "Unusual system with Nc3 and Bg5.",
        "difficulty": "intermediate",
        "category": "closed_game",
        "main_ideas": ["Pin the knight", "f3 and e4 push", "Unconventional play"],
        "famous_games": ["Veresov's original games"]
    },
    {
        "opening_id": "richter_veresov",
        "name": "Richter-Veresov Attack",
        "eco": "D01",
        "moves": ["d4", "Nf6", "Nc3", "d5", "Bg5"],
        "fen": "rnbqkb1r/ppp1pppp/5n2/3p2B1/3P4/2N5/PPP1PPPP/R2QKBNR b KQkq - 2 3",
        "description": "Aggressive system pinning Nf6 and preparing f3-e4.",
        "difficulty": "intermediate",
        "category": "closed_game",
        "main_ideas": ["Pin knight", "Prepare e4", "Aggressive middlegame"],
        "famous_games": ["Richter and Veresov games"]
    },
    {
        "opening_id": "barry_attack",
        "name": "Barry Attack",
        "eco": "D00",
        "moves": ["d4", "Nf6", "Nf3", "g6", "Nc3", "d5", "Bf4"],
        "fen": "rnbqkb1r/ppp1pp1p/5np1/3p4/3P1B2/2N2N2/PPP1PPPP/R2QKB1R b KQkq - 2 4",
        "description": "Anti-King's Indian system with Bf4.",
        "difficulty": "intermediate",
        "category": "closed_game",
        "main_ideas": ["Anti-KID setup", "e3 and Bd3", "Queenside play"],
        "famous_games": ["Mark Hebden's Barry Attack games"]
    },
    {
        "opening_id": "zukertort_opening",
        "name": "Zukertort Opening",
        "eco": "A04",
        "moves": ["Nf3", "c5"],
        "fen": "rnbqkbnr/pp1ppppp/8/2p5/8/5N2/PPPPPPPP/RNBQKB1R w KQkq c6 0 2",
        "description": "Flexible Nf3 followed by various setups.",
        "difficulty": "intermediate",
        "category": "flank",
        "main_ideas": ["Flexible system", "Transpose possibilities", "Control center later"],
        "famous_games": ["Zukertort's tournament games"]
    },
    {
        "opening_id": "catalonian",
        "name": "Catalan (Closed)",
        "eco": "E06-E09",
        "moves": ["d4", "Nf6", "c4", "e6", "g3", "d5", "Bg2", "Be7"],
        "fen": "rnbqk2r/ppp1bppp/4pn2/3p4/2PP4/6P1/PP2PPBP/RNBQK1NR w KQkq - 2 5",
        "description": "Closed Catalan with fianchettoed bishop pressuring the center.",
        "difficulty": "advanced",
        "category": "closed_game",
        "main_ideas": ["Long diagonal pressure", "Positional squeeze", "Endgame edge"],
        "famous_games": ["Kramnik's Catalan games"]
    },
    {
        "opening_id": "catalan_open",
        "name": "Catalan (Open)",
        "eco": "E01-E05",
        "moves": ["d4", "Nf6", "c4", "e6", "g3", "d5", "Bg2", "dxc4"],
        "fen": "rnbqkb1r/ppp2ppp/4pn2/8/2pP4/6P1/PP2PPBP/RNBQK1NR w KQkq - 0 5",
        "description": "Black accepts the gambit pawn in the Catalan.",
        "difficulty": "advanced",
        "category": "closed_game",
        "main_ideas": ["Gambit pawn", "Bg2 pressure", "Long-term compensation"],
        "famous_games": ["Giri's Open Catalan games"]
    },
    {
        "opening_id": "benoni_modern",
        "name": "Modern Benoni",
        "eco": "A60-A79",
        "moves": ["d4", "Nf6", "c4", "c5", "d5", "e6", "Nc3", "exd5", "cxd5", "d6"],
        "fen": "rnbqkb1r/pp3ppp/3p1n2/2pP4/8/2N5/PP2PPPP/R1BQKBNR w KQkq - 0 6",
        "description": "Dynamic defense with asymmetrical pawn structure.",
        "difficulty": "advanced",
        "category": "indian_defense",
        "main_ideas": ["Queenside counterplay", "b5 break", "Dynamic piece play"],
        "famous_games": ["Tal's Benoni brilliancies"]
    },
    {
        "opening_id": "czech_benoni",
        "name": "Czech Benoni",
        "eco": "A56",
        "moves": ["d4", "Nf6", "c4", "c5", "d5", "e5"],
        "fen": "rnbqkb1r/pp1p1ppp/5n2/2pPp3/2P5/8/PP2PPPP/RNBQKBNR w KQkq e6 0 4",
        "description": "Closed Benoni structure with e5, a blocked center.",
        "difficulty": "intermediate",
        "category": "indian_defense",
        "main_ideas": ["Closed center", "f5 break", "Maneuvering game"],
        "famous_games": ["Czech GM games"]
    },
    {
        "opening_id": "leningrad_dutch",
        "name": "Leningrad Dutch System",
        "eco": "A87",
        "moves": ["d4", "f5", "g3", "Nf6", "Bg2", "g6", "Nf3", "Bg7", "O-O", "O-O"],
        "fen": "rnbq1rk1/ppp1p1bp/5np1/5p2/3P4/5NP1/PPP1PPBP/RNBQ1RK1 w - - 4 6",
        "description": "Double fianchetto with f5 kingside ambitions.",
        "difficulty": "advanced",
        "category": "closed_game",
        "main_ideas": ["Kingside attack", "e5 push", "Dynamic play"],
        "famous_games": ["Malaniuk's Leningrad Dutch"]
    },
    {
        "opening_id": "classical_dutch",
        "name": "Classical Dutch",
        "eco": "A82-A84",
        "moves": ["d4", "f5", "c4", "e6", "Nc3", "Nf6", "g3", "Be7"],
        "fen": "rnbqk2r/ppp1b1pp/4pn2/5p2/2PP4/2N3P1/PP2PP1P/R1BQKBNR w KQkq - 1 5",
        "description": "Classical development in the Dutch Defense.",
        "difficulty": "intermediate",
        "category": "closed_game",
        "main_ideas": ["Solid setup", "Kingside expansion", "Ne4 maneuver"],
        "famous_games": ["Botvinnik's Dutch games"]
    },
    {
        "opening_id": "nimzo_larsen",
        "name": "Nimzo-Larsen Attack",
        "eco": "A01",
        "moves": ["b3", "e5"],
        "fen": "rnbqkbnr/pppp1ppp/8/4p3/8/1P6/P1PPPPPP/RNBQKBNR w KQkq e6 0 2",
        "description": "Queenside fianchetto with hypermodern ideas.",
        "difficulty": "intermediate",
        "category": "flank",
        "main_ideas": ["Bb2 fianchetto", "Control e5/d4", "Flexible structure"],
        "famous_games": ["Larsen and Nimzowitsch games"]
    },
    {
        "opening_id": "hedgehog",
        "name": "Hedgehog System",
        "eco": "A30",
        "moves": ["c4", "c5", "Nf3", "Nf6", "g3", "b6", "Bg2", "Bb7"],
        "fen": "rn1qkb1r/pb1ppppp/1p3n2/2p5/2P5/5NP1/PP1PPPBP/RNBQK2R w KQkq - 2 5",
        "description": "Compact pawn structure allowing flexible piece play.",
        "difficulty": "advanced",
        "category": "flank",
        "main_ideas": ["Compact structure", "b5 or d5 breaks", "Patient maneuvering"],
        "famous_games": ["Andersson's Hedgehog games"]
    },
    {
        "opening_id": "torre_london",
        "name": "Torre Attack (Bg5 System)",
        "eco": "A46",
        "moves": ["d4", "Nf6", "Nf3", "e6", "Bg5"],
        "fen": "rnbqkb1r/pppp1ppp/4pn2/6B1/3P4/5N2/PPP1PPPP/RN1QKB1R b KQkq - 2 3",
        "description": "Systematic development with Bg5 pin.",
        "difficulty": "beginner",
        "category": "closed_game",
        "main_ideas": ["Pin the knight", "e3-Bd3 setup", "Solid position"],
        "famous_games": ["Torre's original games"]
    },
    {
        "opening_id": "tromp_attack",
        "name": "Trompowsky Attack (Bg5)",
        "eco": "A45",
        "moves": ["d4", "Nf6", "Bg5"],
        "fen": "rnbqkb1r/pppppppp/5n2/6B1/3P4/8/PPP1PPPP/RN1QKBNR b KQkq - 2 2",
        "description": "Early Bg5 pinning the knight, avoiding main-line theory.",
        "difficulty": "intermediate",
        "category": "closed_game",
        "main_ideas": ["Pin the knight early", "Avoid theory", "Unbalanced play"],
        "famous_games": ["Adams and Hodgson's Tromp games"]
    },
    {
        "opening_id": "wade_defense",
        "name": "Wade Defense",
        "eco": "A41",
        "moves": ["d4", "d6", "Nf3", "Bg4"],
        "fen": "rn1qkbnr/ppp1pppp/3p4/8/3P2b1/5N2/PPP1PPPP/RNBQKB1R w KQkq - 2 3",
        "description": "Early Bg4 pin against Nf3.",
        "difficulty": "beginner",
        "category": "closed_game",
        "main_ideas": ["Pin the knight", "Flexible structure", "Surprise weapon"],
        "famous_games": ["Wade's original games"]
    },
    {
        "opening_id": "old_benoni",
        "name": "Old Benoni Defense",
        "eco": "A43",
        "moves": ["d4", "c5"],
        "fen": "rnbqkbnr/pp1ppppp/8/2p5/3P4/8/PPP1PPPP/RNBQKBNR w KQkq c6 0 2",
        "description": "Simple counter to d4 with c5.",
        "difficulty": "beginner",
        "category": "closed_game",
        "main_ideas": ["Challenge d4", "Benoni structures", "Asymmetry"],
        "famous_games": ["Classical Benoni games"]
    },
    {
        "opening_id": "english_defense",
        "name": "English Defense",
        "eco": "A40",
        "moves": ["d4", "e6", "c4", "b6"],
        "fen": "rnbqkbnr/p1pp1ppp/1p2p3/8/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3",
        "description": "Fianchetto bishop to challenge White's center.",
        "difficulty": "intermediate",
        "category": "closed_game",
        "main_ideas": ["Bb7 pressure", "Flexible pawn structure", "Counter central play"],
        "famous_games": ["Miles and Speelman's games"]
    },
    {
        "opening_id": "modern_benoni_taimanov",
        "name": "Modern Benoni Taimanov Variation",
        "eco": "A67",
        "moves": ["d4", "Nf6", "c4", "c5", "d5", "e6", "Nc3", "exd5", "cxd5", "d6", "e4", "g6", "f4"],
        "fen": "rnbqkb1r/pp3p1p/3p1np1/2pP4/4PP2/2N5/PP4PP/R1BQKBNR b KQkq f3 0 7",
        "description": "Aggressive f4 system against the Modern Benoni.",
        "difficulty": "advanced",
        "category": "indian_defense",
        "main_ideas": ["f4-e5 push", "Kingside attack", "Space advantage"],
        "famous_games": ["Taimanov's original games"]
    },
    {
        "opening_id": "blumenfeld_gambit",
        "name": "Blumenfeld Gambit",
        "eco": "E10",
        "moves": ["d4", "Nf6", "c4", "e6", "Nf3", "c5", "d5", "b5"],
        "fen": "rnbqkb1r/p2p1ppp/4pn2/1ppP4/2P5/5N2/PP2PPPP/RNBQKB1R w KQkq b6 0 5",
        "description": "Bold gambit sacrificing b5 for central control.",
        "difficulty": "intermediate",
        "category": "gambit",
        "main_ideas": ["Sacrifice b5", "Central control", "Active piece play"],
        "famous_games": ["Blumenfeld's original analysis"]
    },
    {
        "opening_id": "volga_gambit",
        "name": "Volga (Benko) Gambit Accepted",
        "eco": "A57-A59",
        "moves": ["d4", "Nf6", "c4", "c5", "d5", "b5", "cxb5", "a6"],
        "fen": "rnbqkb1r/3ppppp/p4n2/1PpP4/8/8/PP2PPPP/RNBQKBNR w KQkq - 0 5",
        "description": "Black sacrifices a pawn for lasting queenside pressure.",
        "difficulty": "intermediate",
        "category": "gambit",
        "main_ideas": ["Queenside pressure", "a and b file play", "Long-term compensation"],
        "famous_games": ["Benko's original games"]
    },
    {
        "opening_id": "budapest_defense",
        "name": "Budapest Defense (Fajarowicz)",
        "eco": "A51-A52",
        "moves": ["d4", "Nf6", "c4", "e5", "dxe5", "Ne4"],
        "fen": "rnbqkb1r/pppp1ppp/8/4P3/2P1n3/8/PP2PPPP/RNBQKBNR w KQkq - 1 4",
        "description": "Fajarowicz variation with Ne4 instead of Ng4.",
        "difficulty": "intermediate",
        "category": "gambit",
        "main_ideas": ["Unexpected Ne4", "Tactical traps", "Surprise weapon"],
        "famous_games": ["Fajarowicz's original analysis"]
    },
    {
        "opening_id": "polish_defense",
        "name": "Polish Defense",
        "eco": "A40",
        "moves": ["d4", "b5"],
        "fen": "rnbqkbnr/p1pppppp/8/1p6/3P4/8/PPP1PPPP/RNBQKBNR w KQkq b6 0 2",
        "description": "Rare defense grabbing queenside space immediately.",
        "difficulty": "beginner",
        "category": "closed_game",
        "main_ideas": ["Queenside expansion", "Surprise value", "Unusual play"],
        "famous_games": ["Rare but fun encounters"]
    },
    {
        "opening_id": "st_george_defense",
        "name": "St. George Defense",
        "eco": "B00",
        "moves": ["e4", "a6"],
        "fen": "rnbqkbnr/1ppppppp/p7/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
        "description": "Flexible and unusual defense preparing b5.",
        "difficulty": "beginner",
        "category": "semi_open",
        "main_ideas": ["Prepare b5", "Flexible", "Avoid theory entirely"],
        "famous_games": ["Miles vs Karpov 1980 (famously won with this!)"]
    },
    {
        "opening_id": "hippopotamus",
        "name": "Hippopotamus Defense",
        "eco": "B00",
        "moves": ["e4", "g6", "d4", "Bg7", "Nc3", "d6", "Nf3", "a6"],
        "fen": "rnbqk1nr/1pp1ppbp/p2p2p1/8/3PP3/2N2N2/PPP2PPP/R1BQKB1R w KQkq - 0 5",
        "description": "Ultra-flexible setup with pawns on 6th rank, pieces behind.",
        "difficulty": "intermediate",
        "category": "semi_open",
        "main_ideas": ["Ultra-flexible", "All pieces behind pawns", "Counter-punch later"],
        "famous_games": ["Various surprise encounters"]
    },
    {
        "opening_id": "rat_defense",
        "name": "Rat Defense (Modern)",
        "eco": "B06",
        "moves": ["e4", "d6", "d4", "Nf6", "Nc3", "g6"],
        "fen": "rnbqkb1r/ppp1pp1p/3p1np1/8/3PP3/2N5/PPP2PPP/R1BQKBNR w KQkq - 0 4",
        "description": "Flexible defense combining Pirc and Modern ideas.",
        "difficulty": "intermediate",
        "category": "semi_open",
        "main_ideas": ["Flexible development", "Counter-attack center", "King Indian-like"],
        "famous_games": ["Various Pirc/Modern games"]
    },
    {
        "opening_id": "robatsch_defense",
        "name": "Robatsch (Modern) Defense",
        "eco": "B06",
        "moves": ["e4", "g6", "d4", "Bg7"],
        "fen": "rnbqk1nr/ppppppbp/6p1/8/3PP3/8/PPP2PPP/RNBQKBNR w KQkq - 1 3",
        "description": "Hypermodern defense letting White build a center to attack later.",
        "difficulty": "intermediate",
        "category": "semi_open",
        "main_ideas": ["Hypermodern approach", "Attack center later", "Flexible structure"],
        "famous_games": ["Robatsch's games"]
    },
    {
        "opening_id": "goring_gambit",
        "name": "Goring Gambit",
        "eco": "C44",
        "moves": ["e4", "e5", "Nf3", "Nc6", "d4", "exd4", "c3"],
        "fen": "r1bqkbnr/pppp1ppp/2n5/8/3pP3/2P2N2/PP3PPP/RNBQKB1R b KQkq - 0 4",
        "description": "Gambit related to the Scotch with c3 push.",
        "difficulty": "intermediate",
        "category": "gambit",
        "main_ideas": ["Sacrifice for center", "Rapid development", "Open lines"],
        "famous_games": ["Goring's original games"]
    },
    {
        "opening_id": "elephant_gambit",
        "name": "Elephant Gambit",
        "eco": "C40",
        "moves": ["e4", "e5", "Nf3", "d5"],
        "fen": "rnbqkbnr/ppp2ppp/8/3pp3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq d6 0 3",
        "description": "Rare counter-gambit by Black, aggressive but risky.",
        "difficulty": "beginner",
        "category": "gambit",
        "main_ideas": ["Counter-gambit", "Surprise value", "Aggressive intent"],
        "famous_games": ["Rare online encounters"]
    },
    {
        "opening_id": "stafford_gambit",
        "name": "Stafford Gambit",
        "eco": "C42",
        "moves": ["e4", "e5", "Nf3", "Nf6", "Nxe5", "Nc6"],
        "fen": "r1bqkb1r/pppp1ppp/2n2n2/4N3/4P3/8/PPPP1PPP/RNBQKB1R w KQkq - 3 4",
        "description": "Trappy gambit popular in online blitz.",
        "difficulty": "beginner",
        "category": "gambit",
        "main_ideas": ["Traps galore", "Piece activity", "Online weapon"],
        "famous_games": ["Eric Rosen's popularization"]
    },
    {
        "opening_id": "marshall_attack",
        "name": "Marshall Attack (Ruy Lopez)",
        "eco": "C89",
        "moves": ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7", "Re1", "b5", "Bb3", "O-O", "c3", "d5"],
        "fen": "r1bq1rk1/2p1bppp/p1n2n2/1p1pp3/4P3/1BP2N2/PP1P1PPP/RNBQR1K1 w - d6 0 9",
        "description": "Famous pawn sacrifice for attacking chances in the Ruy Lopez.",
        "difficulty": "advanced",
        "category": "open_game",
        "main_ideas": ["Pawn sacrifice for attack", "Kingside pressure", "Long-term initiative"],
        "famous_games": ["Marshall vs Capablanca 1918"]
    },
    {
        "opening_id": "berlin_defense",
        "name": "Berlin Defense (Ruy Lopez)",
        "eco": "C65-C67",
        "moves": ["e4", "e5", "Nf3", "Nc6", "Bb5", "Nf6"],
        "fen": "r1bqkb1r/pppp1ppp/2n2n2/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
        "description": "The Berlin Wall - ultra-solid defense popularized by Kramnik.",
        "difficulty": "advanced",
        "category": "open_game",
        "main_ideas": ["Solid endgame", "Berlin Wall structure", "Drawing weapon"],
        "famous_games": ["Kramnik vs Kasparov WC 2000"]
    },
    {
        "opening_id": "petroff_classical",
        "name": "Petrov Classical Attack",
        "eco": "C42",
        "moves": ["e4", "e5", "Nf3", "Nf6", "Nxe5", "d6", "Nf3", "Nxe4", "d4"],
        "fen": "rnbqkb1r/ppp2ppp/3p4/8/3Pn3/5N2/PPP2PPP/RNBQKB1R b KQkq d3 0 5",
        "description": "Main line Petrov's Defense with classical center.",
        "difficulty": "intermediate",
        "category": "open_game",
        "main_ideas": ["Symmetrical structure", "Solid play", "Endgame focus"],
        "famous_games": ["Caruana's Petrov games"]
    },
    {
        "opening_id": "sicilian_moscow",
        "name": "Sicilian Moscow Variation",
        "eco": "B51-B52",
        "moves": ["e4", "c5", "Nf3", "d6", "Bb5+"],
        "fen": "rnbqkbnr/pp2pppp/3p4/1Bp5/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 1 3",
        "description": "Anti-Sicilian check with Bb5+.",
        "difficulty": "intermediate",
        "category": "semi_open",
        "main_ideas": ["Disrupt development", "Anti-Sicilian", "Simple positions"],
        "famous_games": ["Various anti-Sicilian games"]
    },
    {
        "opening_id": "sicilian_o_kelly",
        "name": "Sicilian O'Kelly Variation",
        "eco": "B28",
        "moves": ["e4", "c5", "Nf3", "a6"],
        "fen": "rnbqkbnr/1p1ppppp/p7/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 3",
        "description": "Early a6 preventing Bb5 ideas.",
        "difficulty": "intermediate",
        "category": "semi_open",
        "main_ideas": ["Prevent Bb5", "Flexible setup", "Queenside play"],
        "famous_games": ["O'Kelly's original games"]
    },
    {
        "opening_id": "sicilian_kalashnikov",
        "name": "Sicilian Kalashnikov",
        "eco": "B32",
        "moves": ["e4", "c5", "Nf3", "Nc6", "d4", "cxd4", "Nxd4", "e5", "Nb5", "d6"],
        "fen": "r1bqkbnr/pp3ppp/2np4/1N2p3/4P3/8/PPP2PPP/RNBQKB1R w KQkq - 0 6",
        "description": "Related to Sveshnikov but with d6 instead of a6.",
        "difficulty": "advanced",
        "category": "semi_open",
        "main_ideas": ["e5 push", "Accept structural weakness", "Active play"],
        "famous_games": ["Kalashnikov's games"]
    },
    {
        "opening_id": "pirc_austrian",
        "name": "Pirc Austrian Attack",
        "eco": "B09",
        "moves": ["e4", "d6", "d4", "Nf6", "Nc3", "g6", "f4"],
        "fen": "rnbqkb1r/ppp1pp1p/3p1np1/8/3PPP2/2N5/PPP3PP/R1BQKBNR b KQkq f3 0 4",
        "description": "Aggressive setup with f4 in the Pirc Defense.",
        "difficulty": "intermediate",
        "category": "semi_open",
        "main_ideas": ["Aggressive center", "f5 push", "Kingside attack"],
        "famous_games": ["Fischer's Pirc games"]
    },
    {
        "opening_id": "pirc_classical",
        "name": "Pirc Classical System",
        "eco": "B08",
        "moves": ["e4", "d6", "d4", "Nf6", "Nc3", "g6", "Nf3", "Bg7", "Be2"],
        "fen": "rnbqk2r/ppp1ppbp/3p1np1/8/3PP3/2N2N2/PPP1BPPP/R1BQK2R b KQkq - 3 5",
        "description": "Classical development against the Pirc.",
        "difficulty": "intermediate",
        "category": "semi_open",
        "main_ideas": ["Solid development", "Prepare O-O", "Central dominance"],
        "famous_games": ["Classical Pirc encounters"]
    },
    {
        "opening_id": "alekhine_four_pawns",
        "name": "Alekhine Four Pawns Attack",
        "eco": "B03",
        "moves": ["e4", "Nf6", "e5", "Nd5", "d4", "d6", "c4", "Nb6", "f4"],
        "fen": "rnbqkb1r/ppp1pppp/1n1p4/4P3/2PP1P2/8/PP4PP/RNBQKBNR b KQkq f3 0 5",
        "description": "Aggressive four pawns setup against Alekhine's Defense.",
        "difficulty": "advanced",
        "category": "semi_open",
        "main_ideas": ["Four pawn center", "Space advantage", "Aggressive play"],
        "famous_games": ["Fischer's four pawns Alekhine"]
    },
    {
        "opening_id": "alekhine_exchange",
        "name": "Alekhine Exchange Variation",
        "eco": "B03",
        "moves": ["e4", "Nf6", "e5", "Nd5", "d4", "d6", "c4", "Nb6", "exd6"],
        "fen": "rnbqkb1r/ppp1pppp/1n1P4/8/2PP4/8/PP3PPP/RNBQKBNR b KQkq - 0 5",
        "description": "White exchanges the e5 pawn for a strong center.",
        "difficulty": "intermediate",
        "category": "semi_open",
        "main_ideas": ["Strong center", "Development lead", "Simple positions"],
        "famous_games": ["Exchange Alekhine games"]
    },
    {
        "opening_id": "scandinavian_modern",
        "name": "Scandinavian Modern (Qd6)",
        "eco": "B01",
        "moves": ["e4", "d5", "exd5", "Qxd5", "Nc3", "Qd6"],
        "fen": "rnb1kbnr/ppp1pppp/3q4/8/8/2N5/PPPP1PPP/R1BQKBNR w KQkq - 2 4",
        "description": "Modern Scandinavian keeping the queen on d6.",
        "difficulty": "intermediate",
        "category": "semi_open",
        "main_ideas": ["Queen stays active", "Bf5 development", "Solid structure"],
        "famous_games": ["Tiviakov's Scandinavian games"]
    },
    {
        "opening_id": "scotch_gambit",
        "name": "Scotch Gambit",
        "eco": "C44",
        "moves": ["e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Bc4"],
        "fen": "r1bqkbnr/pppp1ppp/2n5/8/2BpP3/5N2/PPP2PPP/RNBQK2R b KQkq - 1 4",
        "description": "Gambit line of the Scotch Game with Bc4.",
        "difficulty": "intermediate",
        "category": "gambit",
        "main_ideas": ["Development over pawn", "Target f7", "Active play"],
        "famous_games": ["Romantic era Scotch games"]
    },
    {
        "opening_id": "london_barry",
        "name": "London-Barry Hybrid",
        "eco": "D02",
        "moves": ["d4", "Nf6", "Nf3", "d5", "Bf4", "e6", "e3", "Bd6"],
        "fen": "rnbqk2r/ppp2ppp/3bpn2/3p4/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq - 2 5",
        "description": "Hybrid setup combining London and Barry ideas.",
        "difficulty": "beginner",
        "category": "closed_game",
        "main_ideas": ["Solid development", "Bg3 retreat", "Kingside play"],
        "famous_games": ["Modern London players"]
    },
    {
        "opening_id": "breyer_ruy_lopez",
        "name": "Ruy Lopez Breyer Variation",
        "eco": "C94-C95",
        "moves": ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7", "Re1", "b5", "Bb3", "d6", "c3", "O-O", "h3", "Nb8"],
        "fen": "rnbq1rk1/2p1bppp/p2p1n2/1p2p3/4P3/1BP2N1P/PP1P1PP1/RNBQR1K1 w - - 1 10",
        "description": "Deep strategic retreat Nb8 to reroute the knight.",
        "difficulty": "advanced",
        "category": "open_game",
        "main_ideas": ["Knight reroute via Nbd7", "Long-term strategy", "Complex middlegame"],
        "famous_games": ["Karpov's Breyer games"]
    },
    {
        "opening_id": "exchange_slav",
        "name": "Slav Exchange Variation",
        "eco": "D13-D14",
        "moves": ["d4", "d5", "c4", "c6", "cxd5", "cxd5"],
        "fen": "rnbqkbnr/pp2pppp/8/3p4/3P4/8/PP2PPPP/RNBQKBNR w KQkq - 0 4",
        "description": "Symmetrical Slav exchange, often leading to quiet play.",
        "difficulty": "beginner",
        "category": "closed_game",
        "main_ideas": ["Symmetrical structure", "Minority attack", "Simple play"],
        "famous_games": ["Exchange Slav endgames"]
    },
    {
        "opening_id": "chebanenko_slav",
        "name": "Slav Chebanenko Variation",
        "eco": "D15",
        "moves": ["d4", "d5", "c4", "c6", "Nf3", "Nf6", "Nc3", "a6"],
        "fen": "rnbqkb1r/1p2pppp/p1p2n2/3p4/2PP4/2N2N2/PP2PPPP/R1BQKB1R w KQkq - 0 5",
        "description": "Modern Slav with a6 preparing b5 expansion.",
        "difficulty": "intermediate",
        "category": "closed_game",
        "main_ideas": ["Prepare b5", "Queenside expansion", "Modern approach"],
        "famous_games": ["Chebanenko's original games"]
    },
    {
        "opening_id": "anti_berlin",
        "name": "Anti-Berlin (Ruy Lopez d3)",
        "eco": "C65",
        "moves": ["e4", "e5", "Nf3", "Nc6", "Bb5", "Nf6", "d3"],
        "fen": "r1bqkb1r/pppp1ppp/2n2n2/1B2p3/4P3/3P1N2/PPP2PPP/RNBQK2R b KQkq - 0 4",
        "description": "White avoids the Berlin endgame with quiet d3.",
        "difficulty": "intermediate",
        "category": "open_game",
        "main_ideas": ["Avoid Berlin endgame", "Slow buildup", "Italian-like play"],
        "famous_games": ["Modern anti-Berlin games"]
    },
    {
        "opening_id": "symmetrical_english_botvinnik",
        "name": "English Botvinnik System",
        "eco": "A36-A37",
        "moves": ["c4", "c5", "Nc3", "Nc6", "g3", "g6", "Bg2", "Bg7", "e4"],
        "fen": "r1bqk1nr/pp1pppbp/2n3p1/2p5/2P1P3/2N3P1/PP1P1PBP/R1BQK1NR b KQkq - 0 5",
        "description": "Botvinnik system in the Symmetrical English.",
        "difficulty": "advanced",
        "category": "flank",
        "main_ideas": ["Big center with e4", "Bg2 pressure", "Strategic complexity"],
        "famous_games": ["Botvinnik's English system"]
    },
    {
        "opening_id": "dutch_anti_systems",
        "name": "Anti-Dutch (Bg5)",
        "eco": "A80",
        "moves": ["d4", "f5", "Bg5"],
        "fen": "rnbqkbnr/ppppp1pp/8/5pB1/3P4/8/PPP1PPPP/RN1QKBNR b KQkq - 1 2",
        "description": "Aggressive anti-Dutch with early Bg5.",
        "difficulty": "intermediate",
        "category": "closed_game",
        "main_ideas": ["Disrupt Black's plan", "e4 ideas", "Surprise value"],
        "famous_games": ["Anti-Dutch surprise games"]
    },
    {
        "opening_id": "staunton_gambit",
        "name": "Staunton Gambit",
        "eco": "A82-A83",
        "moves": ["d4", "f5", "e4"],
        "fen": "rnbqkbnr/ppppp1pp/8/5p2/3PP3/8/PPP2PPP/RNBQKBNR b KQkq e3 0 2",
        "description": "Aggressive gambit against the Dutch Defense.",
        "difficulty": "intermediate",
        "category": "gambit",
        "main_ideas": ["Challenge f5", "Open center", "Active play"],
        "famous_games": ["Staunton's original analysis"]
    },
    {
        "opening_id": "from_gambit",
        "name": "From's Gambit",
        "eco": "A02",
        "moves": ["f4", "e5"],
        "fen": "rnbqkbnr/pppp1ppp/8/4p3/5P2/8/PPPPP1PP/RNBQKBNR w KQkq e6 0 2",
        "description": "Counter-gambit against Bird's Opening.",
        "difficulty": "intermediate",
        "category": "gambit",
        "main_ideas": ["Counter the Bird", "Open f-file", "Tactical play"],
        "famous_games": ["From's original analysis"]
    },
    {
        "opening_id": "blackburne_shilling",
        "name": "Blackburne Shilling Gambit",
        "eco": "C50",
        "moves": ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nd4"],
        "fen": "r1bqkbnr/pppp1ppp/8/4p3/2BnP3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
        "description": "Trappy gambit with Nd4, popular at club level.",
        "difficulty": "beginner",
        "category": "gambit",
        "main_ideas": ["Trap Nxe5", "Qg5 fork", "Club-level surprise"],
        "famous_games": ["Blackburne's games"]
    },
    {
        "opening_id": "englund_gambit",
        "name": "Englund Gambit",
        "eco": "A40",
        "moves": ["d4", "e5"],
        "fen": "rnbqkbnr/pppp1ppp/8/4p3/3P4/8/PPP1PPPP/RNBQKBNR w KQkq e6 0 2",
        "description": "Dubious but trappy gambit against 1.d4.",
        "difficulty": "beginner",
        "category": "gambit",
        "main_ideas": ["Trap dxe5 Qh4", "Surprise weapon", "Online fun"],
        "famous_games": ["Online blitz traps"]
    },
    {
        "opening_id": "dutch_ilyin_zhenevsky",
        "name": "Dutch Ilyin-Zhenevsky System",
        "eco": "A96-A99",
        "moves": ["d4", "f5", "c4", "Nf6", "g3", "e6", "Bg2", "Be7", "Nf3", "O-O", "O-O", "d6"],
        "fen": "rnbq1rk1/ppp1b1pp/3ppn2/5p2/2PP4/5NP1/PP2PPBP/RNBQ1RK1 w - - 0 7",
        "description": "Classical Dutch setup with Be7 and O-O.",
        "difficulty": "intermediate",
        "category": "closed_game",
        "main_ideas": ["Kingside play", "e5 break", "Central maneuvering"],
        "famous_games": ["Ilyin-Zhenevsky's games"]
    },
    {
        "opening_id": "king_hunt_gambit",
        "name": "King's Gambit Accepted",
        "eco": "C33-C39",
        "moves": ["e4", "e5", "f4", "exf4"],
        "fen": "rnbqkbnr/pppp1ppp/8/8/4Pp2/8/PPPP2PP/RNBQKBNR w KQkq - 0 3",
        "description": "The classic King's Gambit Accepted - full romantic chess.",
        "difficulty": "intermediate",
        "category": "gambit",
        "main_ideas": ["Open f-file", "Fast development", "Romantic attacking chess"],
        "famous_games": ["Immortal Game - Anderssen vs Kieseritzky 1851"]
    },
    {
        "opening_id": "king_gambit_declined",
        "name": "King's Gambit Declined",
        "eco": "C30-C32",
        "moves": ["e4", "e5", "f4", "Bc5"],
        "fen": "rnbqk1nr/pppp1ppp/8/2b1p3/4PP2/8/PPPP2PP/RNBQKBNR w KQkq - 1 3",
        "description": "Black declines the gambit, keeping a solid position.",
        "difficulty": "intermediate",
        "category": "open_game",
        "main_ideas": ["Decline the gambit", "Target f4 weakness", "Solid position"],
        "famous_games": ["Classical declined games"]
    },
    {
        "opening_id": "vienna_copycat",
        "name": "Vienna Game Copycat Variation",
        "eco": "C26",
        "moves": ["e4", "e5", "Nc3", "Nc6"],
        "fen": "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/2N5/PPPP1PPP/R1BQKBNR w KQkq - 2 3",
        "description": "Symmetrical knight development in the Vienna.",
        "difficulty": "beginner",
        "category": "open_game",
        "main_ideas": ["Symmetrical play", "Flexible center", "Multiple plans"],
        "famous_games": ["Classical Vienna games"]
    },
    {
        "opening_id": "ruy_lopez_exchange",
        "name": "Ruy Lopez Exchange Variation",
        "eco": "C68-C69",
        "moves": ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Bxc6", "dxc6"],
        "fen": "r1bqkbnr/1pp1pppp/p1B5/4p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 4",
        "description": "White trades bishop for knight aiming for endgame advantage.",
        "difficulty": "intermediate",
        "category": "open_game",
        "main_ideas": ["Endgame play", "Better pawn structure", "4v3 kingside"],
        "famous_games": ["Fischer's Exchange Ruy games"]
    },
    {
        "opening_id": "italian_two_knights",
        "name": "Italian Game Two Knights Defense",
        "eco": "C55-C59",
        "moves": ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6"],
        "fen": "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
        "description": "Active defense with Nf6 counter-attacking e4.",
        "difficulty": "intermediate",
        "category": "open_game",
        "main_ideas": ["Counter-attack e4", "Active defense", "Tactical complications"],
        "famous_games": ["Many Morphy-era games"]
    },
    {
        "opening_id": "queens_pawn_game",
        "name": "Queen's Pawn Game",
        "eco": "D00",
        "moves": ["d4", "d5"],
        "fen": "rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w KQkq d6 0 2",
        "description": "The basic Queen's Pawn opening.",
        "difficulty": "beginner",
        "category": "closed_game",
        "main_ideas": ["Central control", "Multiple systems", "Solid play"],
        "famous_games": ["Countless classical games"]
    },
    {
        "opening_id": "colle_zukertort",
        "name": "Colle-Zukertort System",
        "eco": "D05",
        "moves": ["d4", "d5", "Nf3", "Nf6", "e3", "e6", "Bd3", "c5", "b3"],
        "fen": "rnbqkb1r/pp3ppp/4pn2/2pp4/3P4/1P1BPN2/P1P2PPP/RNBQK2R b KQkq - 0 5",
        "description": "Systematic queenside fianchetto with the Colle structure.",
        "difficulty": "beginner",
        "category": "closed_game",
        "main_ideas": ["Bb2 fianchetto", "e4 break", "Systematic development"],
        "famous_games": ["Colle's tournament games"]
    },
    {
        "opening_id": "tartakower_qgd",
        "name": "QGD Tartakower Variation",
        "eco": "D58-D59",
        "moves": ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Be7", "e3", "O-O", "Nf3", "h6", "Bh4", "b6"],
        "fen": "rnbq1rk1/p1p1bpp1/1p2pn1p/3p4/2PP3B/2N1PN2/PP3PPP/R2QKB1R w KQ - 0 8",
        "description": "Classical QGD with b6 fianchetto idea.",
        "difficulty": "advanced",
        "category": "closed_game",
        "main_ideas": ["Bb7 development", "Flexible structure", "Active piece play"],
        "famous_games": ["Tartakower's original concept"]
    },
    {
        "opening_id": "dutch_hopton_attack",
        "name": "Dutch Hopton Attack",
        "eco": "A80",
        "moves": ["d4", "f5", "Bg5", "h6", "Bh4", "g5", "e3"],
        "fen": "rnbqkbnr/ppp1p2p/7B/5pp1/3P4/4P3/PPP2PPP/RN1QKBNR b KQkq - 0 4",
        "description": "Anti-Dutch system provoking kingside weaknesses.",
        "difficulty": "intermediate",
        "category": "closed_game",
        "main_ideas": ["Provoke weaknesses", "Exploit g5", "Anti-Dutch weapon"],
        "famous_games": ["Hopton Attack surprise games"]
    },
    {
        "opening_id": "queens_indian_petrosian",
        "name": "Queen's Indian Petrosian System",
        "eco": "E12",
        "moves": ["d4", "Nf6", "c4", "e6", "Nf3", "b6", "a3"],
        "fen": "rnbqkb1r/p1pp1ppp/1p2pn2/8/2PP4/P4N2/1P2PPPP/RNBQKB1R b KQkq - 0 4",
        "description": "Petrosian's a3 system preventing Bb4+.",
        "difficulty": "advanced",
        "category": "indian_defense",
        "main_ideas": ["Prevent Bb4", "Nc3 without pin", "Positional control"],
        "famous_games": ["Petrosian's QI games"]
    },
    {
        "opening_id": "nimzo_leningrad",
        "name": "Nimzo-Indian Leningrad Variation",
        "eco": "E30",
        "moves": ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4", "Bg5"],
        "fen": "rnbqk2r/pppp1ppp/4pn2/6B1/1bPP4/2N5/PP2PPPP/R2QKBNR b KQkq - 3 4",
        "description": "Sharp Bg5 system pinning the knight in the Nimzo.",
        "difficulty": "advanced",
        "category": "indian_defense",
        "main_ideas": ["Pin the knight", "Sharp play", "Complex middlegame"],
        "famous_games": ["Soviet school games"]
    },
    {
        "opening_id": "gruenfeld_fianchetto",
        "name": "Grunfeld Fianchetto Variation",
        "eco": "D90-D99",
        "moves": ["d4", "Nf6", "c4", "g6", "Nc3", "d5", "Nf3", "Bg7", "g3"],
        "fen": "rnbqk2r/ppp1ppbp/5np1/3p4/2PP4/2N2NP1/PP2PP1P/R1BQKB1R b KQkq - 0 5",
        "description": "Quiet fianchetto approach against the Grunfeld.",
        "difficulty": "intermediate",
        "category": "indian_defense",
        "main_ideas": ["Quiet positional approach", "Bg2 pressure", "Avoid theory"],
        "famous_games": ["Karpov's Grunfeld fianchetto"]
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
