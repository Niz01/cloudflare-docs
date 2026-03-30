import { Chess } from 'chess.js';

type AILevel = 'beginner' | 'intermediate' | 'advanced' | 'master';

const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Position evaluation tables for each piece type
const PAWN_TABLE = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
  5,  5, 10, 25, 25, 10,  5,  5,
  0,  0,  0, 20, 20,  0,  0,  0,
  5, -5,-10,  0,  0,-10, -5,  5,
  5, 10, 10,-20,-20, 10, 10,  5,
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

const KING_TABLE = [
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
  20, 20,  0,  0,  0,  0, 20, 20,
  20, 30, 10,  0,  0, 10, 30, 20
];

const POSITION_TABLES: Record<string, number[]> = {
  p: PAWN_TABLE,
  n: KNIGHT_TABLE,
  b: BISHOP_TABLE,
  r: ROOK_TABLE,
  q: QUEEN_TABLE,
  k: KING_TABLE,
};

function getPositionValue(piece: string, square: number, isWhite: boolean): number {
  const table = POSITION_TABLES[piece.toLowerCase()];
  if (!table) return 0;
  
  const index = isWhite ? square : 63 - square;
  return table[index];
}

function evaluateBoard(chess: Chess): number {
  const board = chess.board();
  let score = 0;
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) {
        const isWhite = piece.color === 'w';
        const pieceValue = PIECE_VALUES[piece.type] || 0;
        const positionValue = getPositionValue(piece.type, row * 8 + col, isWhite);
        
        if (isWhite) {
          score += pieceValue + positionValue;
        } else {
          score -= pieceValue + positionValue;
        }
      }
    }
  }
  
  // Bonus for checkmate
  if (chess.isCheckmate()) {
    score = chess.turn() === 'w' ? -Infinity : Infinity;
  }
  
  return score;
}

function minimax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): number {
  if (depth === 0 || chess.isGameOver()) {
    return evaluateBoard(chess);
  }
  
  const moves = chess.moves();
  
  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      chess.move(move);
      const evalScore = minimax(chess, depth - 1, alpha, beta, false);
      chess.undo();
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      chess.move(move);
      const evalScore = minimax(chess, depth - 1, alpha, beta, true);
      chess.undo();
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

export function getBestMove(chess: Chess, level: AILevel): string | null {
  const moves = chess.moves();
  if (moves.length === 0) return null;
  
  const isWhite = chess.turn() === 'w';
  
  switch (level) {
    case 'beginner': {
      // Random move with slight preference for captures
      const captures = moves.filter(m => m.includes('x'));
      if (captures.length > 0 && Math.random() > 0.5) {
        return captures[Math.floor(Math.random() * captures.length)];
      }
      return moves[Math.floor(Math.random() * moves.length)];
    }
    
    case 'intermediate': {
      // Simple evaluation - 1 ply lookahead
      let bestMove = moves[0];
      let bestScore = isWhite ? -Infinity : Infinity;
      
      for (const move of moves) {
        chess.move(move);
        const score = evaluateBoard(chess);
        chess.undo();
        
        if (isWhite && score > bestScore) {
          bestScore = score;
          bestMove = move;
        } else if (!isWhite && score < bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }
      
      // Add some randomness
      if (Math.random() > 0.7) {
        return moves[Math.floor(Math.random() * moves.length)];
      }
      
      return bestMove;
    }
    
    case 'advanced': {
      // Minimax with depth 2
      let bestMove = moves[0];
      let bestScore = isWhite ? -Infinity : Infinity;
      
      for (const move of moves) {
        chess.move(move);
        const score = minimax(chess, 2, -Infinity, Infinity, !isWhite);
        chess.undo();
        
        if (isWhite && score > bestScore) {
          bestScore = score;
          bestMove = move;
        } else if (!isWhite && score < bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }
      
      return bestMove;
    }
    
    case 'master': {
      // Minimax with depth 4 (strongest)
      let bestMove = moves[0];
      let bestScore = isWhite ? -Infinity : Infinity;
      
      for (const move of moves) {
        chess.move(move);
        const score = minimax(chess, 4, -Infinity, Infinity, !isWhite);
        chess.undo();
        
        if (isWhite && score > bestScore) {
          bestScore = score;
          bestMove = move;
        } else if (!isWhite && score < bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }
      
      return bestMove;
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
