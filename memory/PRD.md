# Chess Master - Product Requirements Document

## Overview
A chess.com-like mobile application built with Expo/React Native that allows users to play chess against AI, locally with friends, or online with other players. Features a tiered membership system, progressive puzzle challenges, opening explorer, and game analysis.

## Core Features

### 1. Authentication
- Google OAuth via Emergent Auth
- First registered user automatically becomes Owner with all features unlocked
- Session-based authentication with 7-day expiry

### 2. Game Modes
- **vs Computer**: Play against AI with varying difficulty levels
  - Beginner (Free): Random moves
  - Intermediate (Gold+): Basic evaluation
  - Advanced (Platinum+): Minimax 2-ply
  - Master (Diamond/Owner): Minimax 4-ply
- **Local 2-Player**: Pass and play on the same device
- **Online Multiplayer**: Matchmaking queue to play against other users

### 3. Puzzles
- Four difficulty levels: Easy, Medium, Hard, Impossible
- Daily puzzle limits based on membership:
  - Free: 5/day
  - Gold: 20/day
  - Platinum/Diamond/Owner: Unlimited
- Puzzle rating system that changes based on solve success
- 20 pre-seeded puzzles across all difficulties

### 4. Opening Explorer (NEW)
- 32 chess openings across 6 categories:
  - Open Games (Italian, Ruy Lopez, Scotch, Vienna, Petrov, Philidor, Two Knights)
  - Semi-Open Games (Sicilian, French, Caro-Kann, Scandinavian, Pirc, Alekhine, Najdorf, Dragon)
  - Closed Games (Queen's Gambit, Slav, London, Dutch, Catalan, Trompowsky)
  - Indian Defenses (King's Indian, Nimzo-Indian, Grünfeld, Benoni)
  - Flank Openings (English, Réti, Bird)
  - Gambits (King's Gambit, Evans, Benko, Smith-Morra)
- Interactive board with move-by-move playthrough
- ECO codes, key ideas, and famous games for each opening
- Practice button to start a game with the opening

### 5. Game Analysis (NEW - Premium)
- Move-by-move analysis with evaluation
- Move classification: Excellent, Good, Mistake, Blunder
- Overall accuracy percentage
- Interactive board to review analyzed positions
- Requires Platinum membership or higher

### 6. Membership Tiers
| Tier | Price | AI Levels | Puzzle Limit | Analysis |
|------|-------|-----------|--------------|----------|
| Free | $0 | Beginner | 5/day | No |
| Gold | $4.99/mo | + Intermediate | 20/day | No |
| Platinum | $9.99/mo | + Advanced | Unlimited | Yes |
| Diamond | $19.99/mo | + Master | Unlimited | Yes |
| Owner | $0 | All | Unlimited | Yes |

### 7. User Profile
- Display stats: games played, wins, puzzles solved, rating
- Membership management (demo upgrade)
- Game history with analysis access

## Technical Architecture

### Frontend (Expo/React Native)
- File-based routing with expo-router
- Zustand for state management
- chess.js for game logic and move validation
- Custom ChessBoard component with touch interactions
- 4 main tabs: Play, Puzzles, Learn, Profile

### Backend (FastAPI)
- MongoDB for data persistence
- Session-based authentication
- RESTful API endpoints for games, puzzles, openings, analysis

### Key Endpoints
- `POST /api/auth/session` - Exchange session_id for user
- `GET /api/auth/me` - Get current user
- `POST /api/games` - Create new game
- `PUT /api/games/{id}/move` - Make a move
- `GET /api/games/{id}/analysis` - Get game analysis (Premium)
- `GET /api/puzzles/random` - Get random puzzle
- `POST /api/puzzles/{id}/attempt` - Submit puzzle attempt
- `POST /api/matchmaking/queue` - Join online queue
- `GET /api/openings` - List all openings
- `GET /api/openings/{id}` - Get opening detail

## Status: MVP Complete with Enhancements
- [x] Authentication with Google OAuth
- [x] Play vs Computer (all AI levels)
- [x] Local 2-Player mode
- [x] Online matchmaking (basic)
- [x] Puzzle system with 4 difficulty levels
- [x] Membership tiers with feature gating
- [x] Owner account (first user)
- [x] User profile with stats
- [x] Game history tracking
- [x] Opening Explorer with 16 openings (NEW)
- [x] Game Analysis for premium users (NEW)
