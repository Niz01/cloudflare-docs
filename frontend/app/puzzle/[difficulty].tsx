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
import { PUZZLES } from '../../src/data/puzzleData';
import { useLocalStore } from '../../src/store/localStore';

export default function PuzzleScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { incrementPuzzles } = useLocalStore();
  const difficulty = params.difficulty as string;
  
  const [puzzle, setPuzzle] = useState<any>(null);
  const [chess, setChess] = useState<Chess | null>(null);
  const [fen, setFen] = useState('');
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [puzzleStatus, setPuzzleStatus] = useState<'loading' | 'solving' | 'correct' | 'incorrect' | 'completed'>('loading');
  const [moveIndex, setMoveIndex] = useState(0);
  const [movesMade, setMovesMade] = useState<string[]>([]);
  const [isOpponentMoving, setIsOpponentMoving] = useState(false);

  useEffect(() => { loadPuzzle(); }, [difficulty]);

  const loadPuzzle = () => {
    const pool = PUZZLES.filter((p: any) => p.difficulty === difficulty);
    if (pool.length === 0) {
      Alert.alert('No puzzles', 'No puzzles found for this difficulty.', [{ text: 'OK', onPress: () => router.back() }]);
      return;
    }
    const p = pool[Math.floor(Math.random() * pool.length)];
    setPuzzle(p);
    const c = new Chess(p.fen);
    setChess(c);
    setFen(p.fen);
    setMoveIndex(0);
    setMovesMade([]);
    setPuzzleStatus('solving');
    setSelectedSquare(null);
    setValidMoves([]);
  };

  const handleSquarePress = useCallback((square: string) => {
    if (!chess || !puzzle || puzzleStatus !== 'solving' || isOpponentMoving) return;
    const piece = chess.get(square as any);
    const currentTurn = chess.turn();
    if (piece && piece.color === currentTurn) {
      const moves = chess.moves({ square: square as any, verbose: true });
      setSelectedSquare(square);
      setValidMoves(moves.map(m => m.to));
    } else if (selectedSquare && validMoves.includes(square)) {
      const movingPiece = chess.get(selectedSquare as any);
      let promotion: string | undefined;
      if (movingPiece?.type === 'p' && (square[1] === '8' || square[1] === '1')) promotion = 'q';
      try {
        const move = chess.move({ from: selectedSquare as any, to: square as any, promotion: promotion as any });
        if (move) {
          const expected = puzzle.solution[moveIndex];
          if (move.san === expected || move.lan === expected || `${move.from}${move.to}` === expected || move.san.replace(/[+#]/g, '') === expected.replace(/[+#]/g, '')) {
            setMovesMade([...movesMade, move.san]);
            setFen(chess.fen());
            setSelectedSquare(null);
            setValidMoves([]);
            const newIdx = moveIndex + 1;
            setMoveIndex(newIdx);
            if (newIdx >= puzzle.solution.length) {
              setPuzzleStatus('completed');
              incrementPuzzles(15);
            } else {
              setIsOpponentMoving(true);
              setTimeout(() => {
                try { chess.move(puzzle.solution[newIdx]); setFen(chess.fen()); setMoveIndex(newIdx + 1); } catch (e) {}
                setIsOpponentMoving(false);
              }, 500);
            }
          } else {
            chess.undo();
            setSelectedSquare(null);
            setValidMoves([]);
            setPuzzleStatus('incorrect');
            incrementPuzzles(-10);
          }
        }
      } catch (error) {}
    } else {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  }, [chess, puzzle, selectedSquare, validMoves, puzzleStatus, moveIndex, movesMade, isOpponentMoving]);

  const handleRetry = () => {
    if (!puzzle) return;
    const c = new Chess(puzzle.fen);
    setChess(c); setFen(puzzle.fen); setMoveIndex(0); setMovesMade([]); setPuzzleStatus('solving'); setSelectedSquare(null); setValidMoves([]);
  };

  const getDifficultyColor = () => {
    switch (difficulty) { case 'easy': return '#2ECC71'; case 'medium': return '#F39C12'; case 'hard': return '#E74C3C'; case 'impossible': return '#9B59B6'; default: return '#888'; }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Puzzle</Text>
          <View style={[styles.difficultyBadge, { backgroundColor: `${getDifficultyColor()}20` }]}>
            <Text style={[styles.difficultyText, { color: getDifficultyColor() }]}>{difficulty?.toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>{puzzle?.rating || '...'}</Text>
        </View>
      </View>

      {puzzle && (
        <View style={styles.puzzleInfo}>
          <Text style={styles.turnIndicator}>{chess?.turn() === 'w' ? 'White' : 'Black'} to move</Text>
          {puzzle.theme && <Text style={styles.themeText}>Theme: {puzzle.theme.replace(/_/g, ' ')}</Text>}
        </View>
      )}

      <View style={styles.boardContainer}>
        {puzzleStatus === 'loading' ? (
          <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#FFD700" /><Text style={styles.loadingText}>Loading puzzle...</Text></View>
        ) : chess && (
          <ChessBoard chess={chess} selectedSquare={selectedSquare} validMoves={validMoves} onSquarePress={handleSquarePress} disabled={puzzleStatus !== 'solving' || isOpponentMoving} />
        )}
        {isOpponentMoving && <View style={styles.thinkingOverlay}><ActivityIndicator size="small" color="#FFD700" /></View>}
      </View>

      {puzzleStatus === 'completed' && (
        <View style={[styles.statusBanner, styles.successBanner]}>
          <Ionicons name="checkmark-circle" size={24} color="#2ECC71" />
          <Text style={styles.successText}>Puzzle Solved!</Text>
        </View>
      )}
      {puzzleStatus === 'incorrect' && (
        <View style={[styles.statusBanner, styles.errorBanner]}>
          <Ionicons name="close-circle" size={24} color="#E74C3C" />
          <Text style={styles.errorText}>Incorrect!</Text>
        </View>
      )}
      {puzzleStatus === 'incorrect' && puzzle && (
        <View style={styles.hintContainer}>
          <Text style={styles.hintLabel}>Solution starts with:</Text>
          <Text style={styles.hintText}>{puzzle.solution[0]}</Text>
        </View>
      )}

      <View style={styles.controls}>
        {(puzzleStatus === 'completed' || puzzleStatus === 'incorrect') && (
          <>
            <TouchableOpacity style={styles.controlButton} onPress={handleRetry}>
              <Ionicons name="refresh" size={20} color="#FFFFFF" />
              <Text style={styles.controlText}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.controlButton, styles.nextButton]} onPress={loadPuzzle}>
              <Ionicons name="arrow-forward" size={20} color="#1a1a2e" />
              <Text style={[styles.controlText, { color: '#1a1a2e' }]}>Next</Text>
            </TouchableOpacity>
          </>
        )}
        {puzzleStatus === 'solving' && (
          <TouchableOpacity style={styles.controlButton} onPress={loadPuzzle}>
            <Ionicons name="shuffle" size={20} color="#FFFFFF" />
            <Text style={styles.controlText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { padding: 8 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginRight: 8 },
  difficultyBadge: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 12 },
  difficultyText: { fontSize: 12, fontWeight: 'bold' },
  ratingBadge: { backgroundColor: 'rgba(255, 215, 0, 0.2)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  ratingText: { color: '#FFD700', fontWeight: 'bold', fontSize: 14 },
  puzzleInfo: { alignItems: 'center', paddingVertical: 8 },
  turnIndicator: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  themeText: { fontSize: 12, color: '#888888', marginTop: 4, textTransform: 'capitalize' },
  boardContainer: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 20 },
  loadingContainer: { alignItems: 'center', justifyContent: 'center', height: 300 },
  loadingText: { color: '#888888', marginTop: 16 },
  thinkingOverlay: { position: 'absolute', top: 30, right: 26 },
  statusBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, marginHorizontal: 16, borderRadius: 12, marginBottom: 12 },
  successBanner: { backgroundColor: 'rgba(46, 204, 113, 0.2)' },
  errorBanner: { backgroundColor: 'rgba(231, 76, 60, 0.2)' },
  successText: { color: '#2ECC71', fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
  errorText: { color: '#E74C3C', fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
  hintContainer: { alignItems: 'center', marginBottom: 12 },
  hintLabel: { fontSize: 12, color: '#888888' },
  hintText: { fontSize: 16, color: '#FFD700', fontWeight: 'bold', marginTop: 4 },
  controls: { flexDirection: 'row', padding: 16, gap: 12, marginTop: 'auto' },
  controlButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#16213e', paddingVertical: 14, borderRadius: 12 },
  nextButton: { backgroundColor: '#FFD700' },
  controlText: { fontSize: 16, color: '#FFFFFF', marginLeft: 8 },
});
