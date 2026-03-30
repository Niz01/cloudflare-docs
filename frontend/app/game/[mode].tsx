import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Chess } from 'chess.js';
import ChessBoard from '../../src/components/ChessBoard';
import { useAuthStore } from '../../src/store/authStore';
import { gameApi } from '../../src/utils/api';
import { getBestMove } from '../../src/utils/chessAI';

export default function GameScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  
  const mode = params.mode as string;
  const gameId = params.gameId as string;
  const aiLevel = params.aiLevel as string || 'beginner';
  
  const [chess] = useState(() => new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [gameStatus, setGameStatus] = useState<'playing' | 'checkmate' | 'draw' | 'stalemate'>('playing');
  const [isLoading, setIsLoading] = useState(false);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);

  // Make AI move when it's computer's turn
  useEffect(() => {
    if (mode === 'computer' && !isPlayerTurn && gameStatus === 'playing') {
      makeAIMove();
    }
  }, [isPlayerTurn, gameStatus, mode]);

  const makeAIMove = useCallback(() => {
    setTimeout(() => {
      const aiMove = getBestMove(chess, aiLevel as any);
      if (aiMove) {
        chess.move(aiMove);
        updateGameState();
        setIsPlayerTurn(true);
        
        // Save move to backend
        if (gameId) {
          gameApi.makeMove(gameId, aiMove, chess.fen()).catch(console.error);
        }
      }
    }, 500);
  }, [chess, aiLevel, gameId]);

  const updateGameState = useCallback(() => {
    setFen(chess.fen());
    setSelectedSquare(null);
    setValidMoves([]);
    setMoveHistory(chess.history());
    
    if (chess.isCheckmate()) {
      setGameStatus('checkmate');
      const winner = chess.turn() === 'w' ? 'Black' : 'White';
      setTimeout(() => {
        Alert.alert('Checkmate!', `${winner} wins!`, [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }, 500);
    } else if (chess.isDraw()) {
      setGameStatus('draw');
      setTimeout(() => {
        Alert.alert('Draw!', 'The game ended in a draw.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }, 500);
    } else if (chess.isStalemate()) {
      setGameStatus('stalemate');
      setTimeout(() => {
        Alert.alert('Stalemate!', 'The game ended in a stalemate.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }, 500);
    }
  }, [chess, router]);

  const handleSquarePress = useCallback((square: string) => {
    if (gameStatus !== 'playing') return;
    if (mode === 'computer' && !isPlayerTurn) return;
    
    const piece = chess.get(square as any);
    
    // For local mode, allow both colors to move
    const currentTurn = chess.turn();
    
    if (piece && piece.color === currentTurn) {
      // Select piece
      const moves = chess.moves({ square: square as any, verbose: true });
      setSelectedSquare(square);
      setValidMoves(moves.map(m => m.to));
    } else if (selectedSquare && validMoves.includes(square)) {
      // Make move
      const movingPiece = chess.get(selectedSquare as any);
      let promotion: string | undefined;
      
      // Auto-promote to queen
      if (movingPiece?.type === 'p' && (square[1] === '8' || square[1] === '1')) {
        promotion = 'q';
      }
      
      try {
        const move = chess.move({
          from: selectedSquare as any,
          to: square as any,
          promotion: promotion as any,
        });
        
        if (move) {
          updateGameState();
          
          if (mode === 'computer') {
            setIsPlayerTurn(false);
          }
          
          // Save move to backend
          if (gameId) {
            gameApi.makeMove(gameId, move.san, chess.fen()).catch(console.error);
            
            if (chess.isGameOver()) {
              const status = chess.isCheckmate() ? 'checkmate' : 'draw';
              const winner = chess.isCheckmate()
                ? (chess.turn() === 'w' ? 'black' : user?.user_id)
                : undefined;
              gameApi.endGame(gameId, status, winner).catch(console.error);
            }
          }
        }
      } catch (error) {
        console.error('Invalid move:', error);
      }
    } else {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  }, [chess, selectedSquare, validMoves, gameStatus, mode, isPlayerTurn, gameId, user, updateGameState]);

  const handleResign = () => {
    Alert.alert(
      'Resign',
      'Are you sure you want to resign?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resign',
          style: 'destructive',
          onPress: async () => {
            if (gameId) {
              await gameApi.endGame(gameId, 'resigned', mode === 'computer' ? 'computer' : undefined);
            }
            router.back();
          },
        },
      ]
    );
  };

  const handleNewGame = () => {
    chess.reset();
    setFen(chess.fen());
    setSelectedSquare(null);
    setValidMoves([]);
    setIsPlayerTurn(true);
    setGameStatus('playing');
    setMoveHistory([]);
  };

  const getTurnText = () => {
    if (gameStatus !== 'playing') {
      return gameStatus.charAt(0).toUpperCase() + gameStatus.slice(1);
    }
    
    if (mode === 'computer') {
      return isPlayerTurn ? 'Your turn' : 'Computer thinking...';
    }
    
    return chess.turn() === 'w' ? "White's turn" : "Black's turn";
  };

  const getModeTitle = () => {
    switch (mode) {
      case 'computer': return `vs Computer (${aiLevel})`;
      case 'local': return 'Local Game';
      case 'online': return 'Online Game';
      default: return 'Chess';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>{getModeTitle()}</Text>
          <Text style={styles.turnText}>{getTurnText()}</Text>
        </View>
        <TouchableOpacity style={styles.menuButton} onPress={handleResign}>
          <Ionicons name="flag" size={24} color="#E74C3C" />
        </TouchableOpacity>
      </View>

      {/* Chess Board */}
      <View style={styles.boardContainer}>
        {chess.isCheck() && (
          <View style={styles.checkBanner}>
            <Ionicons name="warning" size={16} color="#E74C3C" />
            <Text style={styles.checkText}>Check!</Text>
          </View>
        )}
        
        <ChessBoard
          chess={chess}
          selectedSquare={selectedSquare}
          validMoves={validMoves}
          onSquarePress={handleSquarePress}
          disabled={gameStatus !== 'playing' || (mode === 'computer' && !isPlayerTurn)}
        />
        
        {mode === 'computer' && !isPlayerTurn && gameStatus === 'playing' && (
          <View style={styles.thinkingOverlay}>
            <ActivityIndicator size="small" color="#FFD700" />
          </View>
        )}
      </View>

      {/* Move History */}
      <View style={styles.historyContainer}>
        <Text style={styles.historyTitle}>Moves</Text>
        <View style={styles.movesList}>
          {moveHistory.map((move, index) => (
            <Text key={index} style={styles.moveItem}>
              {index % 2 === 0 ? `${Math.floor(index / 2) + 1}. ` : ''}{move}
              {index % 2 === 1 ? ' ' : ''}
            </Text>
          ))}
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={handleNewGame}>
          <Ionicons name="refresh" size={20} color="#FFFFFF" />
          <Text style={styles.controlText}>New Game</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.controlButton, styles.resignButton]} onPress={handleResign}>
          <Ionicons name="flag" size={20} color="#E74C3C" />
          <Text style={[styles.controlText, { color: '#E74C3C' }]}>Resign</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  turnText: {
    fontSize: 14,
    color: '#FFD700',
    marginTop: 2,
  },
  menuButton: {
    padding: 8,
  },
  boardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  checkBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  checkText: {
    color: '#E74C3C',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  thinkingOverlay: {
    position: 'absolute',
    top: 10,
    right: 26,
  },
  historyContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 12,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888888',
    marginBottom: 8,
  },
  movesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  moveItem: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  controls: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16213e',
    paddingVertical: 14,
    borderRadius: 12,
  },
  resignButton: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
  },
  controlText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 8,
  },
});
