import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLocalStore } from '../../src/store/localStore';

const AI_LEVELS = [
  { key: 'beginner', name: 'Beginner', description: 'Makes random moves', icon: 'leaf' },
  { key: 'intermediate', name: 'Intermediate', description: 'Basic strategy', icon: 'fitness' },
  { key: 'advanced', name: 'Advanced', description: 'Smart play', icon: 'flash' },
  { key: 'master', name: 'Master', description: 'Strongest AI', icon: 'trophy' },
];

export default function PlayScreen() {
  const router = useRouter();
  const { stats, loadStats } = useLocalStore();
  const [showAIModal, setShowAIModal] = useState(false);

  useEffect(() => { loadStats(); }, []);

  const handleSelectAI = (level: string) => {
    setShowAIModal(false);
    router.push({ pathname: '/game/[mode]', params: { mode: 'computer', aiLevel: level } });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, Player!</Text>
          <View style={styles.membershipBadge}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.membershipText}>ALL ACCESS</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Choose Game Mode</Text>

        <TouchableOpacity style={styles.gameCard} onPress={() => setShowAIModal(true)}>
          <View style={styles.cardIcon}>
            <Ionicons name="hardware-chip" size={32} color="#00D9FF" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Play vs Computer</Text>
            <Text style={styles.cardDescription}>Challenge our AI at various difficulty levels</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#888888" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.gameCard} onPress={() => router.push({ pathname: '/game/[mode]', params: { mode: 'local' } })}>
          <View style={[styles.cardIcon, { backgroundColor: 'rgba(46, 204, 113, 0.1)' }]}>
            <Ionicons name="people" size={32} color="#2ECC71" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Local 2-Player</Text>
            <Text style={styles.cardDescription}>Play with a friend on the same device</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#888888" />
        </TouchableOpacity>

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.gamesPlayed}</Text>
              <Text style={styles.statLabel}>Games</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.gamesWon}</Text>
              <Text style={styles.statLabel}>Wins</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.puzzlesSolved}</Text>
              <Text style={styles.statLabel}>Puzzles</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.puzzleRating}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal visible={showAIModal} transparent animationType="slide" onRequestClose={() => setShowAIModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select AI Difficulty</Text>
            {AI_LEVELS.map((level) => (
              <TouchableOpacity key={level.key} style={styles.aiLevelOption} onPress={() => handleSelectAI(level.key)}>
                <View style={styles.aiLevelIcon}>
                  <Ionicons name={level.icon as any} size={24} color="#FFD700" />
                </View>
                <View style={styles.aiLevelInfo}>
                  <Text style={styles.aiLevelName}>{level.name}</Text>
                  <Text style={styles.aiLevelDesc}>{level.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowAIModal(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  scrollContent: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  membershipBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 215, 0, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  membershipText: { color: '#FFD700', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#FFFFFF', marginBottom: 16 },
  gameCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16213e', borderRadius: 16, padding: 16, marginBottom: 12 },
  cardIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(0, 217, 255, 0.1)', alignItems: 'center', justifyContent: 'center' },
  cardContent: { flex: 1, marginLeft: 16 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
  cardDescription: { fontSize: 14, color: '#888888', marginTop: 4 },
  statsSection: { marginTop: 24 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { flex: 1, alignItems: 'center', backgroundColor: '#16213e', padding: 16, borderRadius: 12, marginHorizontal: 4 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#FFD700' },
  statLabel: { fontSize: 12, color: '#888888', marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#16213e', borderRadius: 20, padding: 24, width: '100%', maxWidth: 400 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center', marginBottom: 20 },
  aiLevelOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: 16, borderRadius: 12, marginBottom: 12 },
  aiLevelIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255, 215, 0, 0.1)', alignItems: 'center', justifyContent: 'center' },
  aiLevelInfo: { flex: 1, marginLeft: 12 },
  aiLevelName: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  aiLevelDesc: { fontSize: 12, color: '#888888', marginTop: 2 },
  modalCloseButton: { marginTop: 8, padding: 16, alignItems: 'center' },
  modalCloseText: { fontSize: 16, color: '#888888' },
});
