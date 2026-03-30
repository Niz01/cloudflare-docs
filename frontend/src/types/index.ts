export interface User {
  user_id: string;
  email: string;
  name: string;
  picture?: string;
  membership: 'free' | 'gold' | 'platinum' | 'diamond' | 'owner';
  is_owner: boolean;
  puzzle_rating: number;
  games_played: number;
  games_won: number;
  puzzles_solved: number;
  created_at: string;
  tier_info?: TierInfo;
}

export interface TierInfo {
  name: string;
  price: number;
  ai_levels: string[];
  puzzle_limit: number;
  analysis: boolean;
}

export interface Game {
  game_id: string;
  white_player_id: string;
  black_player_id?: string;
  mode: 'computer' | 'local' | 'online';
  ai_level?: string;
  status: 'active' | 'checkmate' | 'draw' | 'resigned' | 'timeout';
  winner?: string;
  moves: string[];
  fen: string;
  created_at: string;
  updated_at: string;
}

export interface Puzzle {
  puzzle_id: string;
  fen: string;
  solution: string[];
  difficulty: 'easy' | 'medium' | 'hard' | 'impossible';
  rating: number;
  theme?: string;
}

export interface OnlineMatch {
  match_id: string;
  player1_id: string;
  player2_id?: string;
  game_id?: string;
  status: 'waiting' | 'matched' | 'playing' | 'finished';
  created_at: string;
}

export type Square = 
  | 'a1' | 'a2' | 'a3' | 'a4' | 'a5' | 'a6' | 'a7' | 'a8'
  | 'b1' | 'b2' | 'b3' | 'b4' | 'b5' | 'b6' | 'b7' | 'b8'
  | 'c1' | 'c2' | 'c3' | 'c4' | 'c5' | 'c6' | 'c7' | 'c8'
  | 'd1' | 'd2' | 'd3' | 'd4' | 'd5' | 'd6' | 'd7' | 'd8'
  | 'e1' | 'e2' | 'e3' | 'e4' | 'e5' | 'e6' | 'e7' | 'e8'
  | 'f1' | 'f2' | 'f3' | 'f4' | 'f5' | 'f6' | 'f7' | 'f8'
  | 'g1' | 'g2' | 'g3' | 'g4' | 'g5' | 'g6' | 'g7' | 'g8'
  | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'h7' | 'h8';

export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type PieceColor = 'w' | 'b';

export interface Piece {
  type: PieceType;
  color: PieceColor;
}
