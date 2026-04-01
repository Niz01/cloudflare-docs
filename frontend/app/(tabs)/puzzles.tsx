import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLocalStore } from '../../src/store/localStore';

const DIFFICULTIES = [
  { key: 'easy', name: 'Easy', color: '#2ECC71', icon: 'leaf', rating: '500-700' },
  { key: 'medium', name: 'Medium', color: '#F39C12', icon: 'fitness', rating: '900-1200' },
  { key: 'hard', name: 'Hard', color: '#E74C3C', icon: 'flame', rating: '1300-1700' },
  { key: 'impossible', name: 'Impossible', color: '#9B59B6', icon: 'skull', rating: '1800+' },
];

export default function PuzzlesScreen() {
  const router = useRouter();
  const { stats, loadStats } = useLocalStore();

  useEffect(() => { loadStats(); }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Chess Puzzles</Text>
          <Text style={styles.subtitle}>Train your tactical skills</Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.puzzleRating}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.puzzlesSolved}</Text>
              <Text style={styles.statLabel}>Solved</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Select Difficulty</Text>

        {DIFFICULTIES.map((diff) => (
          <TouchableOpacity
            key={diff.key}
            style={styles.difficultyCard}
            onPress={() => router.push({ pathname: '/puzzle/[difficulty]', params: { difficulty: diff.key } })}
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  scrollContent: { padding: 20 },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' },
  subtitle: { fontSize: 16, color: '#888888', marginTop: 4 },
  statsCard: { backgroundColor: '#16213e', borderRadius: 16, padding: 20, marginBottom: 24 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 28, fontWeight: 'bold', color: '#FFD700' },
  statLabel: { fontSize: 14, color: '#888888', marginTop: 4 },
  statDivider: { width: 1, height: 40, backgroundColor: '#333333' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#FFFFFF', marginBottom: 16 },
  difficultyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16213e', borderRadius: 16, padding: 16, marginBottom: 12 },
  difficultyIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  difficultyContent: { flex: 1, marginLeft: 16 },
  difficultyName: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
  difficultyRating: { fontSize: 14, color: '#888888', marginTop: 4 },
});
