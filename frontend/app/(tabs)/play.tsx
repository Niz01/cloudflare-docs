import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { gameApi, matchmakingApi } from '../../src/utils/api';
import { getAILevelFromMembership } from '../../src/utils/chessAI';

export default function PlayScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [showAIModal, setShowAIModal] = useState(false);
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  const [matchId, setMatchId] = useState<string | null>(null);

  const availableAILevels = getAILevelFromMembership(user?.membership || 'free');
  
  const aiLevelInfo: Record<string, { name: string; description: string; icon: string }> = {
    beginner: { name: 'Beginner', description: 'Makes random moves', icon: 'leaf' },
    intermediate: { name: 'Intermediate', description: 'Basic strategy', icon: 'fitness' },
    advanced: { name: 'Advanced', description: 'Smart play', icon: 'flash' },
    master: { name: 'Master', description: 'Strongest AI', icon: 'trophy' },
  };

  const handlePlayComputer = () => {
    setShowAIModal(true);
  };

  const handleSelectAILevel = async (level: string) => {
    setShowAIModal(false);
    try {
      const game = await gameApi.createGame('computer', level);
      router.push({ pathname: '/game/[mode]', params: { mode: 'computer', gameId: game.game_id, aiLevel: level } });
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create game');
    }
  };

  const handlePlayLocal = async () => {
    try {
      const game = await gameApi.createGame('local');
      router.push({ pathname: '/game/[mode]', params: { mode: 'local', gameId: game.game_id } });
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create game');
    }
  };

  const handlePlayOnline = async () => {
    setIsMatchmaking(true);
    try {
      const match = await matchmakingApi.joinQueue();
      setMatchId(match.match_id);
      
      if (match.status === 'matched' && match.game_id) {
        setIsMatchmaking(false);
        router.push({ pathname: '/game/[mode]', params: { mode: 'online', gameId: match.game_id } });
      } else {
        // Poll for match
        pollForMatch(match.match_id);
      }
    } catch (error: any) {
      setIsMatchmaking(false);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to join matchmaking');
    }
  };

  const pollForMatch = async (id: string) => {
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds
    
    const poll = async () => {
      try {
        const match = await matchmakingApi.getStatus(id);
        if (match.status === 'matched' && match.game_id) {
          setIsMatchmaking(false);
          router.push({ pathname: '/game/[mode]', params: { mode: 'online', gameId: match.game_id } });
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 1000);
        } else {
          setIsMatchmaking(false);
          await matchmakingApi.leaveQueue();
          Alert.alert('Timeout', 'No opponent found. Try again later.');
        }
      } catch (error) {
        setIsMatchmaking(false);
      }
    };
    
    poll();
  };

  const cancelMatchmaking = async () => {
    setIsMatchmaking(false);
    if (matchId) {
      await matchmakingApi.leaveQueue();
      setMatchId(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] || 'Player'}!</Text>
          <View style={styles.membershipBadge}>
            <Ionicons 
              name={user?.membership === 'owner' ? 'star' : user?.membership === 'diamond' ? 'diamond' : 'ribbon'} 
              size={16} 
              color="#FFD700" 
            />
            <Text style={styles.membershipText}>
              {user?.membership?.toUpperCase() || 'FREE'}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Choose Game Mode</Text>

        <TouchableOpacity style={styles.gameCard} onPress={handlePlayComputer}>
          <View style={styles.cardIcon}>
            <Ionicons name="hardware-chip" size={32} color="#00D9FF" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Play vs Computer</Text>
            <Text style={styles.cardDescription}>Challenge our AI at various difficulty levels</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#888888" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.gameCard} onPress={handlePlayLocal}>
          <View style={[styles.cardIcon, { backgroundColor: 'rgba(46, 204, 113, 0.1)' }]}>
            <Ionicons name="people" size={32} color="#2ECC71" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Local 2-Player</Text>
            <Text style={styles.cardDescription}>Play with a friend on the same device</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#888888" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.gameCard} onPress={handlePlayOnline}>
          <View style={[styles.cardIcon, { backgroundColor: 'rgba(155, 89, 182, 0.1)' }]}>
            <Ionicons name="globe" size={32} color="#9B59B6" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Play Online</Text>
            <Text style={styles.cardDescription}>Match with players worldwide</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#888888" />
        </TouchableOpacity>

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.games_played || 0}</Text>
              <Text style={styles.statLabel}>Games</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.games_won || 0}</Text>
              <Text style={styles.statLabel}>Wins</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.puzzles_solved || 0}</Text>
              <Text style={styles.statLabel}>Puzzles</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.puzzle_rating || 800}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* AI Level Selection Modal */}
      <Modal
        visible={showAIModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAIModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select AI Difficulty</Text>
            
            {Object.entries(aiLevelInfo).map(([level, info]) => {
              const isAvailable = availableAILevels.includes(level);
              return (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.aiLevelOption,
                    !isAvailable && styles.aiLevelLocked,
                  ]}
                  onPress={() => isAvailable && handleSelectAILevel(level)}
                  disabled={!isAvailable}
                >
                  <View style={styles.aiLevelIcon}>
                    <Ionicons name={info.icon as any} size={24} color={isAvailable ? '#FFD700' : '#444444'} />
                  </View>
                  <View style={styles.aiLevelInfo}>
                    <Text style={[styles.aiLevelName, !isAvailable && styles.lockedText]}>
                      {info.name}
                    </Text>
                    <Text style={[styles.aiLevelDesc, !isAvailable && styles.lockedText]}>
                      {info.description}
                    </Text>
                  </View>
                  {!isAvailable && (
                    <Ionicons name="lock-closed" size={20} color="#444444" />
                  )}
                </TouchableOpacity>
              );
            })}
            
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowAIModal(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Matchmaking Modal */}
      <Modal
        visible={isMatchmaking}
        transparent
        animationType="fade"
        onRequestClose={cancelMatchmaking}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.matchmakingContent}>
            <ActivityIndicator size="large" color="#FFD700" />
            <Text style={styles.matchmakingText}>Finding opponent...</Text>
            <TouchableOpacity style={styles.cancelButton} onPress={cancelMatchmaking}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  membershipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  membershipText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardDescription: {
    fontSize: 14,
    color: '#888888',
    marginTop: 4,
  },
  statsSection: {
    marginTop: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#16213e',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  statLabel: {
    fontSize: 12,
    color: '#888888',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#16213e',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  aiLevelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  aiLevelLocked: {
    opacity: 0.5,
  },
  aiLevelIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiLevelInfo: {
    flex: 1,
    marginLeft: 12,
  },
  aiLevelName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  aiLevelDesc: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
  },
  lockedText: {
    color: '#444444',
  },
  modalCloseButton: {
    marginTop: 8,
    padding: 16,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#888888',
  },
  matchmakingContent: {
    backgroundColor: '#16213e',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
  },
  matchmakingText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 20,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});
