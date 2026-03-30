import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { puzzleApi, adminApi } from '../../src/utils/api';

const DIFFICULTIES = [
  { key: 'easy', name: 'Easy', color: '#2ECC71', icon: 'leaf', rating: '600-800' },
  { key: 'medium', name: 'Medium', color: '#F39C12', icon: 'fitness', rating: '900-1200' },
  { key: 'hard', name: 'Hard', color: '#E74C3C', icon: 'flame', rating: '1300-1700' },
  { key: 'impossible', name: 'Impossible', color: '#9B59B6', icon: 'skull', rating: '1800+' },
];

export default function PuzzlesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const tierInfo = {
    free: { limit: 5, name: 'Free' },
    gold: { limit: 20, name: 'Gold' },
    platinum: { limit: -1, name: 'Platinum' },
    diamond: { limit: -1, name: 'Diamond' },
    owner: { limit: -1, name: 'Owner' },
  };

  const currentTier = tierInfo[user?.membership as keyof typeof tierInfo] || tierInfo.free;

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await puzzleApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDifficulty = (difficulty: string) => {
    router.push({ pathname: '/puzzle/[difficulty]', params: { difficulty } });
  };

  const handleSeedPuzzles = async () => {
    if (!user?.is_owner) {
      Alert.alert('Access Denied', 'Only the owner can seed puzzles');
      return;
    }
    
    setSeeding(true);
    try {
      const result = await adminApi.seedPuzzles();
      Alert.alert('Success', result.message);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to seed puzzles');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Chess Puzzles</Text>
          <Text style={styles.subtitle}>Train your tactical skills</Text>
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats?.rating || user?.puzzle_rating || 800}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats?.solved || 0}</Text>
              <Text style={styles.statLabel}>Solved</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{Math.round(stats?.success_rate || 0)}%</Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>
          </View>
          
          {currentTier.limit > 0 && (
            <View style={styles.limitWarning}>
              <Ionicons name="information-circle" size={16} color="#F39C12" />
              <Text style={styles.limitText}>
                {currentTier.limit} puzzles/day ({currentTier.name})
              </Text>
            </View>
          )}
        </View>

        {/* Difficulty Selection */}
        <Text style={styles.sectionTitle}>Select Difficulty</Text>

        {DIFFICULTIES.map((diff) => (
          <TouchableOpacity
            key={diff.key}
            style={styles.difficultyCard}
            onPress={() => handleSelectDifficulty(diff.key)}
          >
            <View style={[styles.difficultyIcon, { backgroundColor: `${diff.color}20` }]}>
              <Ionicons name={diff.icon as any} size={28} color={diff.color} />
            </View>
            <View style={styles.difficultyContent}>
              <Text style={styles.difficultyName}>{diff.name}</Text>
              <Text style={styles.difficultyRating}>Rating: {diff.rating}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#888888" />
          </TouchableOpacity>
        ))}

        {/* Owner: Seed Puzzles Button */}
        {user?.is_owner && (
          <TouchableOpacity
            style={styles.seedButton}
            onPress={handleSeedPuzzles}
            disabled={seeding}
          >
            {seeding ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="download" size={20} color="#FFFFFF" />
                <Text style={styles.seedButtonText}>Seed Puzzles (Owner)</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Upgrade CTA for free users */}
        {currentTier.limit > 0 && (
          <View style={styles.upgradeCTA}>
            <Ionicons name="diamond" size={24} color="#FFD700" />
            <View style={styles.upgradeContent}>
              <Text style={styles.upgradeTitle}>Unlock Unlimited Puzzles</Text>
              <Text style={styles.upgradeDesc}>Upgrade to Platinum or Diamond</Text>
            </View>
            <TouchableOpacity 
              style={styles.upgradeButton}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Text style={styles.upgradeButtonText}>Upgrade</Text>
            </TouchableOpacity>
          </View>
        )}
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
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
    marginTop: 4,
  },
  statsCard: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  statLabel: {
    fontSize: 14,
    color: '#888888',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#333333',
  },
  limitWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  limitText: {
    fontSize: 14,
    color: '#F39C12',
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  difficultyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  difficultyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  difficultyContent: {
    flex: 1,
    marginLeft: 16,
  },
  difficultyName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  difficultyRating: {
    fontSize: 14,
    color: '#888888',
    marginTop: 4,
  },
  seedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9B59B6',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  seedButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  upgradeCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  upgradeContent: {
    flex: 1,
    marginLeft: 12,
  },
  upgradeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  upgradeDesc: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
  },
  upgradeButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  upgradeButtonText: {
    color: '#1a1a2e',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
