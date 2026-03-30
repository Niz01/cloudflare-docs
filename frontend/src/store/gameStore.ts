import { create } from 'zustand';
import { Chess } from 'chess.js';
import { Game, Puzzle } from '../types';
import { gameApi, puzzleApi } from '../utils/api';
import { getBestMove } from '../utils/chessAI';

interface GameState {
  // Current game
  currentGame: Game | null;
  chess: Chess;
  selectedSquare: string | null;
  validMoves: string[];
  isPlayerTurn: boolean;
  gameStatus: 'playing' | 'checkmate' | 'draw' | 'stalemate' | 'resigned';
  
  // Puzzle
  currentPuzzle: Puzzle | null;
  puzzleMoveIndex: number;
  puzzleStatus: 'solving' | 'correct' | 'incorrect' | 'completed';
  
  // Actions
  initGame: (game: Game) => void;
  selectSquare: (square: string) => void;
  makeMove: (from: string, to: string, promotion?: string) => Promise<boolean>;
  makeAIMove: (level: string) => void;
  resetGame: () => void;
  
  // Puzzle actions
  initPuzzle: (puzzle: Puzzle) => void;
  makePuzzleMove: (from: string, to: string, promotion?: string) => boolean;
  resetPuzzle: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  currentGame: null,
  chess: new Chess(),
  selectedSquare: null,
  validMoves: [],
  isPlayerTurn: true,
  gameStatus: 'playing',
  
  currentPuzzle: null,
  puzzleMoveIndex: 0,
  puzzleStatus: 'solving',
  
  initGame: (game) => {
    const chess = new Chess(game.fen);
    set({
      currentGame: game,
      chess,
      selectedSquare: null,
      validMoves: [],
      isPlayerTurn: true,
      gameStatus: 'playing',
    });
  },
  
  selectSquare: (square) => {
    const { chess, selectedSquare, isPlayerTurn, currentGame } = get();
    
    // Don't allow selection if not player's turn (vs computer)
    if (currentGame?.mode === 'computer' && !isPlayerTurn) return;
    
    const piece = chess.get(square as any);
    
    // If clicking on own piece, select it
    if (piece && piece.color === chess.turn()) {
      const moves = chess.moves({ square: square as any, verbose: true });
      set({
        selectedSquare: square,
        validMoves: moves.map(m => m.to),
      });
    } else if (selectedSquare) {
      // Try to make a move
      const validMoves = get().validMoves;
      if (validMoves.includes(square)) {
        // Check for pawn promotion
        const movingPiece = chess.get(selectedSquare as any);
        if (movingPiece?.type === 'p' && (square[1] === '8' || square[1] === '1')) {
          // Auto-promote to queen for simplicity
          get().makeMove(selectedSquare, square, 'q');
        } else {
          get().makeMove(selectedSquare, square);
        }
      } else {
        set({ selectedSquare: null, validMoves: [] });
      }
    }
  },
  
  makeMove: async (from, to, promotion) => {
    const { chess, currentGame } = get();
    
    try {
      const move = chess.move({ from: from as any, to: to as any, promotion: promotion as any });
      if (!move) return false;
      
      // Update state
      let gameStatus: 'playing' | 'checkmate' | 'draw' | 'stalemate' = 'playing';
      if (chess.isCheckmate()) gameStatus = 'checkmate';
      else if (chess.isDraw()) gameStatus = 'draw';
      else if (chess.isStalemate()) gameStatus = 'stalemate';
      
      set({
        selectedSquare: null,
        validMoves: [],
        gameStatus,
        isPlayerTurn: currentGame?.mode === 'local' ? true : false,
      });
      
      // Save move to backend
      if (currentGame) {
        await gameApi.makeMove(currentGame.game_id, move.san, chess.fen());
        
        if (gameStatus !== 'playing') {
          const winner = gameStatus === 'checkmate' 
            ? (chess.turn() === 'w' ? currentGame.black_player_id : currentGame.white_player_id)
            : undefined;
          await gameApi.endGame(currentGame.game_id, gameStatus, winner);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Move error:', error);
      return false;
    }
  },
  
  makeAIMove: (level) => {
    const { chess, currentGame } = get();
    
    if (chess.isGameOver()) return;
    
    // Small delay for UX
    setTimeout(async () => {
      const aiMove = getBestMove(chess, level as any);
      if (aiMove) {
        chess.move(aiMove);
        
        let gameStatus: 'playing' | 'checkmate' | 'draw' | 'stalemate' = 'playing';
        if (chess.isCheckmate()) gameStatus = 'checkmate';
        else if (chess.isDraw()) gameStatus = 'draw';
        else if (chess.isStalemate()) gameStatus = 'stalemate';
        
        set({
          gameStatus,
          isPlayerTurn: true,
        });
        
        // Save AI move to backend
        if (currentGame) {
          await gameApi.makeMove(currentGame.game_id, aiMove, chess.fen());
          
          if (gameStatus !== 'playing') {
            const winner = gameStatus === 'checkmate'
              ? (chess.turn() === 'w' ? currentGame.black_player_id : currentGame.white_player_id)
              : undefined;
            await gameApi.endGame(currentGame.game_id, gameStatus, winner);
          }
        }
      }
    }, 500);
  },
  
  resetGame: () => {
    set({
      currentGame: null,
      chess: new Chess(),
      selectedSquare: null,
      validMoves: [],
      isPlayerTurn: true,
      gameStatus: 'playing',
    });
  },
  
  initPuzzle: (puzzle) => {
    const chess = new Chess(puzzle.fen);
    set({
      currentPuzzle: puzzle,
      chess,
      puzzleMoveIndex: 0,
      puzzleStatus: 'solving',
      selectedSquare: null,
      validMoves: [],
    });
  },
  
  makePuzzleMove: (from, to, promotion) => {
    const { chess, currentPuzzle, puzzleMoveIndex } = get();
    if (!currentPuzzle) return false;
    
    try {
      const move = chess.move({ from: from as any, to: to as any, promotion: promotion as any });
      if (!move) return false;
      
      const expectedMove = currentPuzzle.solution[puzzleMoveIndex];
      
      // Check if move matches solution
      if (move.san === expectedMove || move.lan === expectedMove) {
        const newIndex = puzzleMoveIndex + 1;
        
        if (newIndex >= currentPuzzle.solution.length) {
          // Puzzle completed!
          set({
            puzzleMoveIndex: newIndex,
            puzzleStatus: 'completed',
            selectedSquare: null,
            validMoves: [],
          });
        } else {
          // More moves to go - make opponent's response
          set({ puzzleMoveIndex: newIndex });
          
          // Make opponent's move from solution
          setTimeout(() => {
            const { chess: currentChess, currentPuzzle: cp, puzzleMoveIndex: pmi } = get();
            if (cp && pmi < cp.solution.length) {
              const opponentMove = cp.solution[pmi];
              currentChess.move(opponentMove);
              set({
                puzzleMoveIndex: pmi + 1,
                selectedSquare: null,
                validMoves: [],
              });
            }
          }, 300);
        }
        
        set({ selectedSquare: null, validMoves: [] });
        return true;
      } else {
        // Wrong move
        chess.undo();
        set({
          puzzleStatus: 'incorrect',
          selectedSquare: null,
          validMoves: [],
        });
        return false;
      }
    } catch (error) {
      return false;
    }
  },
  
  resetPuzzle: () => {
    const { currentPuzzle } = get();
    if (currentPuzzle) {
      const chess = new Chess(currentPuzzle.fen);
      set({
        chess,
        puzzleMoveIndex: 0,
        puzzleStatus: 'solving',
        selectedSquare: null,
        validMoves: [],
      });
    }
  },
}));
