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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { openingsApi, Opening } from '../../src/utils/api';

const CATEGORIES = [
  { key: 'all', name: 'All Openings', icon: 'library' },
  { key: 'open_game', name: 'Open Games', icon: 'flash' },
  { key: 'semi_open', name: 'Semi-Open', icon: 'partly-sunny' },
  { key: 'closed_game', name: 'Closed Games', icon: 'lock-closed' },
  { key: 'indian_defense', name: 'Indian Defenses', icon: 'shield' },
  { key: 'flank', name: 'Flank Openings', icon: 'arrow-forward' },
  { key: 'gambit', name: 'Gambits', icon: 'flame' },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: '#2ECC71',
  intermediate: '#F39C12',
  advanced: '#E74C3C',
};

export default function LearnScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadOpenings();
  }, [selectedCategory]);

  const loadOpenings = async () => {
    setLoading(true);
    try {
      const category = selectedCategory === 'all' ? undefined : selectedCategory;
      const data = await openingsApi.getOpenings(category);
      setOpenings(data);
    } catch (error) {
      console.error('Failed to load openings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpeningPress = (opening: Opening) => {
    router.push({
      pathname: '/learn/[openingId]',
      params: { openingId: opening.opening_id }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Opening Explorer</Text>
          <Text style={styles.subtitle}>Master chess openings like the pros</Text>
        </View>

        {/* Category Filter */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContainer}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.categoryChip,
                selectedCategory === cat.key && styles.categoryChipActive
              ]}
              onPress={() => setSelectedCategory(cat.key)}
            >
              <Ionicons 
                name={cat.icon as any} 
                size={16} 
                color={selectedCategory === cat.key ? '#1a1a2e' : '#888888'} 
              />
              <Text style={[
                styles.categoryText,
                selectedCategory === cat.key && styles.categoryTextActive
              ]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Quick Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Ionicons name="book" size={24} color="#FFD700" />
            <Text style={styles.statValue}>{openings.length}</Text>
            <Text style={styles.statLabel}>Openings</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="school" size={24} color="#2ECC71" />
            <Text style={styles.statValue}>
              {openings.filter(o => o.difficulty === 'beginner').length}
            </Text>
            <Text style={styles.statLabel}>Beginner</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="trophy" size={24} color="#E74C3C" />
            <Text style={styles.statValue}>
              {openings.filter(o => o.difficulty === 'advanced').length}
            </Text>
            <Text style={styles.statLabel}>Advanced</Text>
          </View>
        </View>

        {/* Openings List */}
        <Text style={styles.sectionTitle}>Chess Openings</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color="#FFD700" style={styles.loader} />
        ) : (
          openings.map((opening) => (
            <TouchableOpacity
              key={opening.opening_id}
              style={styles.openingCard}
              onPress={() => handleOpeningPress(opening)}
            >
              <View style={styles.openingHeader}>
                <View style={styles.openingInfo}>
                  <Text style={styles.openingName}>{opening.name}</Text>
                  <Text style={styles.openingEco}>ECO: {opening.eco}</Text>
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
              
              <Text style={styles.openingDescription} numberOfLines={2}>
                {opening.description}
              </Text>
              
              <View style={styles.openingMoves}>
                <Text style={styles.movesLabel}>Moves: </Text>
                <Text style={styles.movesText}>{opening.moves.join(' ')}</Text>
              </View>
              
              <View style={styles.openingFooter}>
                <View style={styles.tagContainer}>
                  {opening.main_ideas.slice(0, 2).map((idea, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{idea}</Text>
                    </View>
                  ))}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#888888" />
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Analysis Section */}
        <View style={styles.analysisSection}>
          <Text style={styles.sectionTitle}>Game Analysis</Text>
          <TouchableOpacity
            style={styles.analysisCard}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <View style={styles.analysisIcon}>
              <Ionicons name="analytics" size={32} color="#9B59B6" />
            </View>
            <View style={styles.analysisContent}>
              <Text style={styles.analysisTitle}>Analyze Your Games</Text>
              <Text style={styles.analysisDesc}>
                Review your games with move-by-move analysis
              </Text>
              {user?.membership === 'free' || user?.membership === 'gold' ? (
                <View style={styles.premiumBadge}>
                  <Ionicons name="diamond" size={14} color="#FFD700" />
                  <Text style={styles.premiumText}>Platinum+ Required</Text>
                </View>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={24} color="#888888" />
          </TouchableOpacity>
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
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
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
  categoryScroll: {
    marginBottom: 20,
    marginHorizontal: -20,
  },
  categoryContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#FFD700',
  },
  categoryText: {
    color: '#888888',
    fontSize: 14,
    marginLeft: 6,
  },
  categoryTextActive: {
    color: '#1a1a2e',
    fontWeight: '600',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#888888',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#333333',
    marginHorizontal: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  loader: {
    marginVertical: 40,
  },
  openingCard: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  openingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  openingInfo: {
    flex: 1,
  },
  openingName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  openingEco: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
  },
  difficultyBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  openingDescription: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 12,
    lineHeight: 20,
  },
  openingMoves: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  movesLabel: {
    fontSize: 12,
    color: '#888888',
  },
  movesText: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '600',
    flex: 1,
  },
  openingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  tagText: {
    fontSize: 10,
    color: '#AAAAAA',
  },
  analysisSection: {
    marginTop: 24,
  },
  analysisCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 16,
  },
  analysisIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(155, 89, 182, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  analysisContent: {
    flex: 1,
    marginLeft: 16,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  analysisDesc: {
    fontSize: 12,
    color: '#888888',
    marginTop: 4,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  premiumText: {
    fontSize: 12,
    color: '#FFD700',
    marginLeft: 4,
  },
});
