# Chess Master - Product Requirements Document

## Overview
A chess.com-like mobile application built with Expo/React Native that allows users to play chess against AI, locally with friends, or online with other players. Features a tiered membership system and progressive puzzle challenges.

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

### 4. Membership Tiers
| Tier | Price | AI Levels | Puzzle Limit | Analysis |
|------|-------|-----------|--------------|----------|
| Free | $0 | Beginner | 5/day | No |
| Gold | $4.99/mo | + Intermediate | 20/day | No |
| Platinum | $9.99/mo | + Advanced | Unlimited | Yes |
| Diamond | $19.99/mo | + Master | Unlimited | Yes |
| Owner | $0 | All | Unlimited | Yes |

### 5. User Profile
- Display stats: games played, wins, puzzles solved, rating
- Membership management (demo upgrade)
- Game history

## Technical Architecture

### Frontend (Expo/React Native)
- File-based routing with expo-router
- Zustand for state management
- chess.js for game logic and move validation
- Custom ChessBoard component with touch interactions

### Backend (FastAPI)
- MongoDB for data persistence
- Session-based authentication
- RESTful API endpoints for games, puzzles, users

### Key Endpoints
- `POST /api/auth/session` - Exchange session_id for user
- `GET /api/auth/me` - Get current user
- `POST /api/games` - Create new game
- `PUT /api/games/{id}/move` - Make a move
- `GET /api/puzzles/random` - Get random puzzle
- `POST /api/puzzles/{id}/attempt` - Submit puzzle attempt
- `POST /api/matchmaking/queue` - Join online queue

## Status: MVP Complete
- [x] Authentication with Google OAuth
- [x] Play vs Computer (all AI levels)
- [x] Local 2-Player mode
- [x] Online matchmaking (basic)
- [x] Puzzle system with 4 difficulty levels
- [x] Membership tiers with feature gating
- [x] Owner account (first user)
- [x] User profile with stats
- [x] Game history tracking
