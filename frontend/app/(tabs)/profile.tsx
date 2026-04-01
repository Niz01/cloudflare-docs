import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalStore } from '../../src/store/localStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const { stats, loadStats } = useLocalStore();

  useEffect(() => { loadStats(); }, []);

  const handleResetStats = () => {
    Alert.alert('Reset Stats', 'Clear all saved progress?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('chess_stats');
          await loadStats();
          Alert.alert('Done', 'Stats have been reset.');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>♔</Text>
          </View>
          <Text style={styles.userName}>Player</Text>
          <View style={styles.membershipTag}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.membershipTagText}>ALL ACCESS</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.gridItem}>
            <Ionicons name="game-controller" size={24} color="#00D9FF" />
            <Text style={styles.gridValue}>{stats.gamesPlayed}</Text>
            <Text style={styles.gridLabel}>Games</Text>
          </View>
          <View style={styles.gridItem}>
            <Ionicons name="trophy" size={24} color="#FFD700" />
            <Text style={styles.gridValue}>{stats.gamesWon}</Text>
            <Text style={styles.gridLabel}>Wins</Text>
          </View>
          <View style={styles.gridItem}>
            <Ionicons name="bulb" size={24} color="#2ECC71" />
            <Text style={styles.gridValue}>{stats.puzzlesSolved}</Text>
            <Text style={styles.gridLabel}>Puzzles</Text>
          </View>
          <View style={styles.gridItem}>
            <Ionicons name="analytics" size={24} color="#9B59B6" />
            <Text style={styles.gridValue}>{stats.puzzleRating}</Text>
            <Text style={styles.gridLabel}>Rating</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#FFD700" />
          <Text style={styles.infoText}>All progress is saved locally in your browser. No account needed!</Text>
        </View>

        <TouchableOpacity style={styles.resetButton} onPress={handleResetStats}>
          <Ionicons name="trash" size={20} color="#E74C3C" />
          <Text style={styles.resetText}>Reset All Stats</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  scrollContent: { padding: 20 },
  profileHeader: { alignItems: 'center', marginBottom: 24 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFD700', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 50, color: '#1a1a2e' },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginTop: 12 },
  membershipTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 215, 0, 0.15)', paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, marginTop: 12 },
  membershipTagText: { fontSize: 14, fontWeight: 'bold', color: '#FFD700', marginLeft: 6 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 24 },
  gridItem: { width: '50%', alignItems: 'center', padding: 16 },
  gridValue: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginTop: 8 },
  gridLabel: { fontSize: 12, color: '#888888', marginTop: 4 },
  infoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 215, 0, 0.1)', borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.3)' },
  infoText: { flex: 1, marginLeft: 12, fontSize: 14, color: '#CCCCCC', lineHeight: 20 },
  resetButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(231, 76, 60, 0.1)', borderRadius: 12, padding: 16 },
  resetText: { fontSize: 16, color: '#E74C3C', fontWeight: '600', marginLeft: 8 },
});
