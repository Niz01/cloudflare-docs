import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Chess } from 'chess.js';
import ChessBoard from '../../src/components/ChessBoard';
import { analysisApi, gameApi, GameAnalysis, MoveAnalysis } from '../../src/utils/api';
import { useAuthStore } from '../../src/store/authStore';

const CLASSIFICATION_COLORS: Record<string, string> = {
  excellent: '#2ECC71',
  good: '#3498DB',
  mistake: '#F39C12',
  blunder: '#E74C3C',
};

const CLASSIFICATION_ICONS: Record<string, string> = {
  excellent: 'star',
  good: 'checkmark-circle',
  mistake: 'alert-circle',
  blunder: 'close-circle',
};

export default function AnalysisScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const gameId = params.gameId as string;
  
  const [analysis, setAnalysis] = useState<GameAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [chess] = useState(() => new Chess());
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [fen, setFen] = useState(chess.fen());
  const [game, setGame] = useState<any>(null);

  useEffect(() => {
    loadAnalysis();
  }, [gameId]);

  const loadAnalysis = async () => {
    try {
      // Load game first
      const gameData = await gameApi.getGame(gameId);
      setGame(gameData);
      
      // Load analysis
      const analysisData = await analysisApi.getGameAnalysis(gameId);
      setAnalysis(analysisData);
      
      chess.reset();
      setFen(chess.fen());
      setCurrentMoveIndex(0);
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to load analysis';
      Alert.alert('Error', message, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveClick = (index: number) => {
    if (!game) return;
    
    // Reset and replay up to this move
    chess.reset();
    for (let i = 0; i <= index; i++) {
      try {
        chess.move(game.moves[i]);
      } catch (e) {}
    }
    setFen(chess.fen());
    setCurrentMoveIndex(index + 1);
  };

  const handleNextMove = () => {
    if (!game || currentMoveIndex >= game.moves.length) return;
    
    try {
      chess.move(game.moves[currentMoveIndex]);
      setFen(chess.fen());
      setCurrentMoveIndex(currentMoveIndex + 1);
    } catch (error) {
      console.error('Move error:', error);
    }
  };

  const handlePrevMove = () => {
    if (currentMoveIndex <= 0) return;
    
    chess.undo();
    setFen(chess.fen());
    setCurrentMoveIndex(currentMoveIndex - 1);
  };

  const handleReset = () => {
    chess.reset();
    setFen(chess.fen());
    setCurrentMoveIndex(0);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Analyzing game...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!analysis || !game) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Analysis not available</Text>
      </SafeAreaView>
    );
  }

  const currentAnalysis = currentMoveIndex > 0 ? analysis.analysis[currentMoveIndex - 1] : null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Game Analysis</Text>
        <View style={styles.accuracyBadge}>
          <Text style={styles.accuracyText}>{analysis.summary.accuracy}%</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Summary Stats */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Ionicons name="star" size={20} color="#2ECC71" />
            <Text style={styles.summaryValue}>{analysis.summary.excellent_moves}</Text>
            <Text style={styles.summaryLabel}>Excellent</Text>
          </View>
          <View style={styles.summaryItem}>
            <Ionicons name="checkmark-circle" size={20} color="#3498DB" />
            <Text style={styles.summaryValue}>{analysis.summary.good_moves}</Text>
            <Text style={styles.summaryLabel}>Good</Text>
          </View>
          <View style={styles.summaryItem}>
            <Ionicons name="alert-circle" size={20} color="#F39C12" />
            <Text style={styles.summaryValue}>{analysis.summary.mistakes}</Text>
            <Text style={styles.summaryLabel}>Mistakes</Text>
          </View>
          <View style={styles.summaryItem}>
            <Ionicons name="close-circle" size={20} color="#E74C3C" />
            <Text style={styles.summaryValue}>{analysis.summary.blunders}</Text>
            <Text style={styles.summaryLabel}>Blunders</Text>
          </View>
        </View>

        {/* Chess Board */}
        <View style={styles.boardContainer}>
          <ChessBoard
            chess={chess}
            selectedSquare={null}
            validMoves={[]}
            onSquarePress={() => {}}
            disabled={true}
          />
        </View>

        {/* Current Move Analysis */}
        {currentAnalysis && (
          <View style={[
            styles.currentMoveCard,
            { borderLeftColor: CLASSIFICATION_COLORS[currentAnalysis.classification] }
          ]}>
            <View style={styles.currentMoveHeader}>
              <Ionicons 
                name={CLASSIFICATION_ICONS[currentAnalysis.classification] as any} 
                size={24} 
                color={CLASSIFICATION_COLORS[currentAnalysis.classification]} 
              />
              <Text style={styles.currentMoveNumber}>Move {currentAnalysis.move_number}</Text>
              <Text style={styles.currentMoveText}>{currentAnalysis.move}</Text>
            </View>
            <Text style={styles.currentMoveComment}>{currentAnalysis.comment}</Text>
            <Text style={[
              styles.evalText,
              { color: currentAnalysis.evaluation >= 0 ? '#2ECC71' : '#E74C3C' }
            ]}>
              Eval: {currentAnalysis.evaluation > 0 ? '+' : ''}{currentAnalysis.evaluation.toFixed(2)}
            </Text>
          </View>
        )}

        {/* Navigation Controls */}
        <View style={styles.controls}>
          <TouchableOpacity 
            style={[styles.controlButton, currentMoveIndex === 0 && styles.controlDisabled]}
            onPress={handleReset}
            disabled={currentMoveIndex === 0}
          >
            <Ionicons name="play-skip-back" size={24} color={currentMoveIndex === 0 ? '#444' : '#FFFFFF'} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.controlButton, currentMoveIndex === 0 && styles.controlDisabled]}
            onPress={handlePrevMove}
            disabled={currentMoveIndex === 0}
          >
            <Ionicons name="play-back" size={24} color={currentMoveIndex === 0 ? '#444' : '#FFFFFF'} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.controlButton, 
              styles.mainButton,
              currentMoveIndex >= game.moves.length && styles.controlDisabled
            ]}
            onPress={handleNextMove}
            disabled={currentMoveIndex >= game.moves.length}
          >
            <Ionicons name="play-forward" size={28} color={currentMoveIndex >= game.moves.length ? '#444' : '#1a1a2e'} />
          </TouchableOpacity>
        </View>

        {/* Move List with Analysis */}
        <View style={styles.moveListCard}>
          <Text style={styles.moveListTitle}>Move-by-Move Analysis</Text>
          {analysis.analysis.map((moveAnalysis, index) => (
            <TouchableOpacity 
              key={index} 
              style={[
                styles.moveListItem,
                index === currentMoveIndex - 1 && styles.moveListItemActive
              ]}
              onPress={() => handleMoveClick(index)}
            >
              <View style={styles.moveListLeft}>
                <Text style={styles.moveListNumber}>{moveAnalysis.move_number}.</Text>
                <Text style={styles.moveListMove}>{moveAnalysis.move}</Text>
              </View>
              <View style={[
                styles.classificationBadge,
                { backgroundColor: `${CLASSIFICATION_COLORS[moveAnalysis.classification]}20` }
              ]}>
                <Ionicons 
                  name={CLASSIFICATION_ICONS[moveAnalysis.classification] as any} 
                  size={14} 
                  color={CLASSIFICATION_COLORS[moveAnalysis.classification]} 
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888888',
    fontSize: 16,
    marginTop: 16,
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
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
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  accuracyBadge: {
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  accuracyText: {
    color: '#2ECC71',
    fontWeight: 'bold',
    fontSize: 14,
  },
  scrollContent: {
    padding: 16,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#888888',
    marginTop: 2,
  },
  boardContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  currentMoveCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  currentMoveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentMoveNumber: {
    fontSize: 14,
    color: '#888888',
    marginLeft: 8,
  },
  currentMoveText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  currentMoveComment: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 8,
  },
  evalText: {
    fontSize: 14,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#16213e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFD700',
  },
  controlDisabled: {
    opacity: 0.5,
  },
  moveListCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
  },
  moveListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  moveListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  moveListItemActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  moveListLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moveListNumber: {
    fontSize: 14,
    color: '#888888',
    width: 30,
  },
  moveListMove: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  classificationBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
