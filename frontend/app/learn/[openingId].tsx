import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Chess } from 'chess.js';
import ChessBoard from '../../src/components/ChessBoard';
import { openingsApi, Opening } from '../../src/utils/api';

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: '#2ECC71',
  intermediate: '#F39C12',
  advanced: '#E74C3C',
};

export default function OpeningDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const openingId = params.openingId as string;
  
  const [opening, setOpening] = useState<Opening | null>(null);
  const [loading, setLoading] = useState(true);
  const [chess] = useState(() => new Chess());
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [fen, setFen] = useState(chess.fen());

  useEffect(() => {
    loadOpening();
  }, [openingId]);

  const loadOpening = async () => {
    try {
      const data = await openingsApi.getOpening(openingId);
      setOpening(data);
      chess.reset();
      setFen(chess.fen());
      setCurrentMoveIndex(0);
    } catch (error) {
      console.error('Failed to load opening:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNextMove = () => {
    if (!opening || currentMoveIndex >= opening.moves.length) return;
    
    try {
      chess.move(opening.moves[currentMoveIndex]);
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

  const handlePlayAll = () => {
    if (!opening) return;
    
    chess.reset();
    opening.moves.forEach(move => {
      try {
        chess.move(move);
      } catch (e) {}
    });
    setFen(chess.fen());
    setCurrentMoveIndex(opening.moves.length);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#FFD700" style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (!opening) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Opening not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>{opening.name}</Text>
            <Text style={styles.eco}>ECO: {opening.eco}</Text>
          </View>
          <View style={[
            styles.difficultyBadge,
            { backgroundColor: `${DIFFICULTY_COLORS[opening.difficulty]}20` }
          ]}>
            <Text style={[
              styles.difficultyText,
              { color: DIFFICULTY_COLORS[opening.difficulty] }
            ]}>
              {opening.difficulty.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.descriptionCard}>
          <Text style={styles.description}>{opening.description}</Text>
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

        {/* Move Navigation */}
        <View style={styles.moveProgress}>
          <Text style={styles.moveCounter}>
            Move {currentMoveIndex} / {opening.moves.length}
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(currentMoveIndex / opening.moves.length) * 100}%` }
              ]} 
            />
          </View>
        </View>

        {/* Moves Display */}
        <View style={styles.movesCard}>
          <Text style={styles.movesTitle}>Opening Moves</Text>
          <View style={styles.movesList}>
            {opening.moves.map((move, index) => (
              <View 
                key={index} 
                style={[
                  styles.moveItem,
                  index < currentMoveIndex && styles.moveItemPlayed
                ]}
              >
                <Text style={[
                  styles.moveText,
                  index < currentMoveIndex && styles.moveTextPlayed
                ]}>
                  {index + 1}. {move}
                </Text>
              </View>
            ))}
          </View>
        </View>

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
              currentMoveIndex >= opening.moves.length && styles.controlDisabled
            ]}
            onPress={handleNextMove}
            disabled={currentMoveIndex >= opening.moves.length}
          >
            <Ionicons name="play-forward" size={28} color={currentMoveIndex >= opening.moves.length ? '#444' : '#1a1a2e'} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.controlButton, currentMoveIndex >= opening.moves.length && styles.controlDisabled]}
            onPress={handlePlayAll}
            disabled={currentMoveIndex >= opening.moves.length}
          >
            <Ionicons name="play-skip-forward" size={24} color={currentMoveIndex >= opening.moves.length ? '#444' : '#FFFFFF'} />
          </TouchableOpacity>
        </View>

        {/* Main Ideas */}
        <View style={styles.ideasCard}>
          <Text style={styles.ideasTitle}>Key Ideas</Text>
          {opening.main_ideas.map((idea, index) => (
            <View key={index} style={styles.ideaItem}>
              <Ionicons name="checkmark-circle" size={18} color="#2ECC71" />
              <Text style={styles.ideaText}>{idea}</Text>
            </View>
          ))}
        </View>

        {/* Famous Games */}
        {opening.famous_games.length > 0 && (
          <View style={styles.gamesCard}>
            <Text style={styles.gamesTitle}>Famous Games</Text>
            {opening.famous_games.map((game, index) => (
              <View key={index} style={styles.gameItem}>
                <Ionicons name="trophy" size={16} color="#FFD700" />
                <Text style={styles.gameText}>{game}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Practice Button */}
        <TouchableOpacity 
          style={styles.practiceButton}
          onPress={() => router.push({ 
            pathname: '/game/[mode]', 
            params: { mode: 'computer', aiLevel: 'beginner' } 
          })}
        >
          <Ionicons name="game-controller" size={20} color="#1a1a2e" />
          <Text style={styles.practiceText}>Practice This Opening</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  scrollContent: {
    padding: 20,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
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
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  eco: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
  },
  difficultyBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  descriptionCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 22,
  },
  boardContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  moveProgress: {
    marginBottom: 16,
  },
  moveCounter: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#333333',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 2,
  },
  movesCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  movesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888888',
    marginBottom: 12,
  },
  movesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  moveItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  moveItemPlayed: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  moveText: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  moveTextPlayed: {
    color: '#FFD700',
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
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
  ideasCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  ideasTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  ideaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  ideaText: {
    fontSize: 14,
    color: '#CCCCCC',
    marginLeft: 10,
    flex: 1,
  },
  gamesCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  gamesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  gameItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  gameText: {
    fontSize: 14,
    color: '#CCCCCC',
    marginLeft: 10,
  },
  practiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  practiceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    marginLeft: 8,
  },
});
