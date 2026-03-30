import { Chess } from 'chess.js';

type AILevel = 'beginner' | 'intermediate' | 'advanced' | 'master';

// Piece values (centipawns)
const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Piece-Square Tables for positional evaluation
// Values are from White's perspective; flip for Black

const PAWN_TABLE = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
  5,  5, 10, 27, 27, 10,  5,  5,
  0,  0,  0, 25, 25,  0,  0,  0,
  5, -5,-10,  0,  0,-10, -5,  5,
  5, 10, 10,-25,-25, 10, 10,  5,
  0,  0,  0,  0,  0,  0,  0,  0
];

const KNIGHT_TABLE = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50
];

const BISHOP_TABLE = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20
];

const ROOK_TABLE = [
  0,  0,  0,  0,  0,  0,  0,  0,
  5, 10, 10, 10, 10, 10, 10,  5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  0,  0,  0,  5,  5,  0,  0,  0
];

const QUEEN_TABLE = [
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5,  5,  5,  5,  0,-10,
  -5,  0,  5,  5,  5,  5,  0, -5,
  0,  0,  5,  5,  5,  5,  0, -5,
  -10,  5,  5,  5,  5,  5,  0,-10,
  -10,  0,  5,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20
];

const KING_MIDDLEGAME_TABLE = [
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
  20, 20,  0,  0,  0,  0, 20, 20,
  20, 30, 10,  0,  0, 10, 30, 20
];

const KING_ENDGAME_TABLE = [
  -50,-40,-30,-20,-20,-30,-40,-50,
  -30,-20,-10,  0,  0,-10,-20,-30,
  -30,-10, 20, 30, 30, 20,-10,-30,
  -30,-10, 30, 40, 40, 30,-10,-30,
  -30,-10, 30, 40, 40, 30,-10,-30,
  -30,-10, 20, 30, 30, 20,-10,-30,
  -30,-30,  0,  0,  0,  0,-30,-30,
  -50,-30,-30,-30,-30,-30,-30,-50
];

const POSITION_TABLES: Record<string, number[]> = {
  p: PAWN_TABLE,
  n: KNIGHT_TABLE,
  b: BISHOP_TABLE,
  r: ROOK_TABLE,
  q: QUEEN_TABLE,
  k: KING_MIDDLEGAME_TABLE,
};

function getPositionValue(piece: string, square: number, isWhite: boolean, isEndgame: boolean = false): number {
  let table = POSITION_TABLES[piece.toLowerCase()];
  
  // Use endgame king table if applicable
  if (piece.toLowerCase() === 'k' && isEndgame) {
    table = KING_ENDGAME_TABLE;
  }
  
  if (!table) return 0;
  
  const index = isWhite ? square : 63 - square;
  return table[index];
}

function isEndgame(chess: Chess): boolean {
  const board = chess.board();
  let queenCount = 0;
  let minorMajorCount = 0;
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) {
        if (piece.type === 'q') queenCount++;
        if (['r', 'b', 'n'].includes(piece.type)) minorMajorCount++;
      }
    }
  }
  
  // Endgame if no queens or each side has <= 1 minor piece with queen
  return queenCount === 0 || (queenCount <= 2 && minorMajorCount <= 2);
}

function evaluateBoard(chess: Chess): number {
  const board = chess.board();
  let score = 0;
  const endgame = isEndgame(chess);
  
  // Material and position
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) {
        const isWhite = piece.color === 'w';
        const pieceValue = PIECE_VALUES[piece.type] || 0;
        const positionValue = getPositionValue(piece.type, row * 8 + col, isWhite, endgame);
        
        if (isWhite) {
          score += pieceValue + positionValue;
        } else {
          score -= pieceValue + positionValue;
        }
      }
    }
  }
  
  // Mobility bonus (number of legal moves)
  const currentMoves = chess.moves().length;
  const mobilityBonus = currentMoves * 3;
  score += chess.turn() === 'w' ? mobilityBonus : -mobilityBonus;
  
  // Check bonus
  if (chess.isCheck()) {
    score += chess.turn() === 'w' ? -30 : 30;
  }
  
  // Checkmate
  if (chess.isCheckmate()) {
    score = chess.turn() === 'w' ? -100000 : 100000;
  }
  
  // Stalemate (draw)
  if (chess.isStalemate() || chess.isDraw()) {
    score = 0;
  }
  
  return score;
}

// Move ordering for alpha-beta efficiency
function orderMoves(chess: Chess, moves: string[]): string[] {
  const scored: { move: string; score: number }[] = [];
  
  for (const move of moves) {
    let score = 0;
    
    // Prioritize captures (MVV-LVA: Most Valuable Victim - Least Valuable Attacker)
    if (move.includes('x')) {
      score += 1000;
      // Try to identify captured piece
      if (move.includes('Q') || move.toLowerCase().includes('q')) score += 900;
      else if (move.includes('R') || move.toLowerCase().includes('r')) score += 500;
      else if (move.includes('B') || move.toLowerCase().includes('b')) score += 330;
      else if (move.includes('N') || move.toLowerCase().includes('n')) score += 320;
    }
    
    // Prioritize checks
    if (move.includes('+')) score += 500;
    if (move.includes('#')) score += 10000;
    
    // Prioritize promotions
    if (move.includes('=')) score += 800;
    
    // Prioritize center moves
    if (move.includes('d4') || move.includes('d5') || 
        move.includes('e4') || move.includes('e5')) {
      score += 50;
    }
    
    // Castling is usually good
    if (move === 'O-O' || move === 'O-O-O') score += 100;
    
    scored.push({ move, score });
  }
  
  return scored.sort((a, b) => b.score - a.score).map(s => s.move);
}

// Negamax with alpha-beta pruning
function negamax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  color: number // 1 for White, -1 for Black
): number {
  if (depth === 0 || chess.isGameOver()) {
    return color * evaluateBoard(chess);
  }
  
  const moves = orderMoves(chess, chess.moves());
  let bestScore = -Infinity;
  
  for (const move of moves) {
    chess.move(move);
    const score = -negamax(chess, depth - 1, -beta, -alpha, -color);
    chess.undo();
    
    bestScore = Math.max(bestScore, score);
    alpha = Math.max(alpha, score);
    
    if (alpha >= beta) break; // Beta cutoff
  }
  
  return bestScore;
}

// Iterative deepening for time management (simplified)
function searchBestMove(chess: Chess, maxDepth: number): string | null {
  const moves = orderMoves(chess, chess.moves());
  if (moves.length === 0) return null;
  
  const color = chess.turn() === 'w' ? 1 : -1;
  let bestMove = moves[0];
  let bestScore = -Infinity;
  
  // Search at target depth
  for (const move of moves) {
    chess.move(move);
    const score = -negamax(chess, maxDepth - 1, -Infinity, Infinity, -color);
    chess.undo();
    
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  
  return bestMove;
}

export function getBestMove(chess: Chess, level: AILevel): string | null {
  const moves = chess.moves();
  if (moves.length === 0) return null;
  
  switch (level) {
    case 'beginner': {
      // Random with preference for good moves
      const orderedMoves = orderMoves(chess, moves);
      
      // 60% chance to pick from top half of moves, 40% random
      if (Math.random() < 0.6 && orderedMoves.length > 2) {
        const topMoves = orderedMoves.slice(0, Math.ceil(orderedMoves.length / 2));
        return topMoves[Math.floor(Math.random() * topMoves.length)];
      }
      return moves[Math.floor(Math.random() * moves.length)];
    }
    
    case 'intermediate': {
      // Depth 2 search with occasional randomness
      if (Math.random() < 0.2) {
        const orderedMoves = orderMoves(chess, moves);
        return orderedMoves[Math.floor(Math.random() * Math.min(3, orderedMoves.length))];
      }
      return searchBestMove(chess, 2);
    }
    
    case 'advanced': {
      // Depth 3 search - strong club player
      return searchBestMove(chess, 3);
    }
    
    case 'master': {
      // Depth 4 search - very strong
      return searchBestMove(chess, 4);
    }
    
    default:
      return moves[Math.floor(Math.random() * moves.length)];
  }
}

export function getAILevelFromMembership(membership: string): AILevel[] {
  switch (membership) {
    case 'owner':
    case 'diamond':
      return ['beginner', 'intermediate', 'advanced', 'master'];
    case 'platinum':
      return ['beginner', 'intermediate', 'advanced'];
    case 'gold':
      return ['beginner', 'intermediate'];
    default:
      return ['beginner'];
  }
}

// Evaluation explanation for analysis
export function explainMove(chess: Chess, move: string): string {
  const isCapture = move.includes('x');
  const isCheck = move.includes('+');
  const isCheckmate = move.includes('#');
  const isCastle = move === 'O-O' || move === 'O-O-O';
  const isPromotion = move.includes('=');
  
  if (isCheckmate) return 'Checkmate!';
  if (isCheck && isCapture) return 'Captures with check - strong move';
  if (isCheck) return 'Gives check';
  if (isCastle) return 'King safety - castling';
  if (isPromotion) return 'Pawn promotion';
  if (isCapture) return 'Captures material';
  
  // Center control
  if (move.includes('d4') || move.includes('d5') || 
      move.includes('e4') || move.includes('e5')) {
    return 'Controls the center';
  }
  
  return 'Development move';
}
