import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { OPENINGS } from '../../src/data/openingData';

const CATEGORIES = [
  { key: 'all', name: 'All', icon: 'library' },
  { key: 'open_game', name: 'Open', icon: 'flash' },
  { key: 'semi_open', name: 'Semi-Open', icon: 'partly-sunny' },
  { key: 'closed_game', name: 'Closed', icon: 'lock-closed' },
  { key: 'indian_defense', name: 'Indian', icon: 'shield' },
  { key: 'flank', name: 'Flank', icon: 'arrow-forward' },
  { key: 'gambit', name: 'Gambits', icon: 'flame' },
];

const DIFF_COLORS: Record<string, string> = { beginner: '#2ECC71', intermediate: '#F39C12', advanced: '#E74C3C' };

export default function LearnScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (selectedCategory === 'all') return OPENINGS;
    return OPENINGS.filter((o: any) => o.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Opening Explorer</Text>
        <Text style={styles.subtitle}>{filtered.length} openings</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={styles.catContainer}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[styles.catChip, selectedCategory === cat.key && styles.catChipActive]}
              onPress={() => setSelectedCategory(cat.key)}
            >
              <Text style={[styles.catText, selectedCategory === cat.key && styles.catTextActive]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filtered.map((opening: any) => (
          <TouchableOpacity
            key={opening.opening_id}
            style={styles.card}
            onPress={() => setExpandedId(expandedId === opening.opening_id ? null : opening.opening_id)}
          >
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{opening.name}</Text>
                <Text style={styles.cardEco}>ECO: {opening.eco}</Text>
              </View>
              <View style={[styles.diffBadge, { backgroundColor: `${DIFF_COLORS[opening.difficulty] || '#888'}20` }]}>
                <Text style={[styles.diffText, { color: DIFF_COLORS[opening.difficulty] || '#888' }]}>
                  {opening.difficulty?.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.cardDesc} numberOfLines={expandedId === opening.opening_id ? undefined : 2}>{opening.description}</Text>
            <View style={styles.movesRow}>
              <Text style={styles.movesLabel}>Moves: </Text>
              <Text style={styles.movesText}>{opening.moves.join(' ')}</Text>
            </View>
            {expandedId === opening.opening_id && (
              <View style={styles.expandedSection}>
                <Text style={styles.expandedLabel}>Key Ideas:</Text>
                {opening.main_ideas?.map((idea: string, i: number) => (
                  <Text key={i} style={styles.ideaText}>• {idea}</Text>
                ))}
                {opening.famous_games?.[0] && (
                  <Text style={styles.famousText}>Notable: {opening.famous_games[0]}</Text>
                )}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  scrollContent: { padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' },
  subtitle: { fontSize: 14, color: '#888888', marginTop: 4, marginBottom: 16 },
  catScroll: { marginBottom: 20, marginHorizontal: -20 },
  catContainer: { paddingHorizontal: 20, gap: 8 },
  catChip: { backgroundColor: '#16213e', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, marginRight: 8 },
  catChipActive: { backgroundColor: '#FFD700' },
  catText: { color: '#888888', fontSize: 13 },
  catTextActive: { color: '#1a1a2e', fontWeight: '600' },
  card: { backgroundColor: '#16213e', borderRadius: 16, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardName: { fontSize: 17, fontWeight: '600', color: '#FFFFFF' },
  cardEco: { fontSize: 12, color: '#888888', marginTop: 2 },
  diffBadge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8 },
  diffText: { fontSize: 10, fontWeight: 'bold' },
  cardDesc: { fontSize: 14, color: '#AAAAAA', marginBottom: 10, lineHeight: 20 },
  movesRow: { flexDirection: 'row', backgroundColor: 'rgba(255, 215, 0, 0.1)', padding: 8, borderRadius: 8 },
  movesLabel: { fontSize: 12, color: '#888888' },
  movesText: { fontSize: 12, color: '#FFD700', fontWeight: '600', flex: 1 },
  expandedSection: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#333' },
  expandedLabel: { fontSize: 13, fontWeight: '600', color: '#FFD700', marginBottom: 6 },
  ideaText: { fontSize: 13, color: '#CCCCCC', marginBottom: 4 },
  famousText: { fontSize: 12, color: '#888', marginTop: 8, fontStyle: 'italic' },
});
