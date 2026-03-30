import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { userApi, gameApi } from '../../src/utils/api';

const MEMBERSHIP_TIERS = [
  {
    key: 'free',
    name: 'Free',
    price: '$0',
    color: '#888888',
    features: ['Beginner AI', '5 puzzles/day', 'Local games'],
  },
  {
    key: 'gold',
    name: 'Gold',
    price: '$4.99/mo',
    color: '#F39C12',
    features: ['Intermediate AI', '20 puzzles/day', 'Online matchmaking'],
  },
  {
    key: 'platinum',
    name: 'Platinum',
    price: '$9.99/mo',
    color: '#BDC3C7',
    features: ['Advanced AI', 'Unlimited puzzles', 'Game analysis'],
  },
  {
    key: 'diamond',
    name: 'Diamond',
    price: '$19.99/mo',
    color: '#00D9FF',
    features: ['Master AI', 'All features', 'Priority support'],
  },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuthStore();
  const [gameHistory, setGameHistory] = useState<any[]>([]);

  useEffect(() => {
    loadGameHistory();
  }, []);

  const loadGameHistory = async () => {
    try {
      const games = await gameApi.getHistory();
      setGameHistory(games.slice(0, 5));
    } catch (error) {
      console.error('Failed to load game history:', error);
    }
  };

  const handleUpgrade = async (tier: string) => {
    if (user?.is_owner) {
      Alert.alert('Owner Account', 'You already have access to all features!');
      return;
    }
    
    // In production, this would integrate with payment processing
    Alert.alert(
      'Upgrade Membership',
      `Upgrade to ${tier}? (Demo - no actual payment)`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Upgrade',
          onPress: async () => {
            try {
              await userApi.updateMembership(tier);
              await refreshUser();
              Alert.alert('Success', `Upgraded to ${tier}!`);
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.detail || 'Failed to upgrade');
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const getMembershipIcon = () => {
    switch (user?.membership) {
      case 'owner': return 'star';
      case 'diamond': return 'diamond';
      case 'platinum': return 'ribbon';
      case 'gold': return 'medal';
      default: return 'person';
    }
  };

  const getMembershipColor = () => {
    switch (user?.membership) {
      case 'owner': return '#FFD700';
      case 'diamond': return '#00D9FF';
      case 'platinum': return '#BDC3C7';
      case 'gold': return '#F39C12';
      default: return '#888888';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {user?.picture ? (
              <Image source={{ uri: user.picture }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: getMembershipColor() }]}>
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
            )}
            {user?.is_owner && (
              <View style={styles.ownerBadge}>
                <Ionicons name="star" size={12} color="#1a1a2e" />
              </View>
            )}
          </View>
          <Text style={styles.userName}>{user?.name || 'Player'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={[styles.membershipTag, { backgroundColor: `${getMembershipColor()}20` }]}>
            <Ionicons name={getMembershipIcon() as any} size={16} color={getMembershipColor()} />
            <Text style={[styles.membershipTagText, { color: getMembershipColor() }]}>
              {user?.is_owner ? 'OWNER' : user?.membership?.toUpperCase() || 'FREE'}
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.gridItem}>
            <Ionicons name="game-controller" size={24} color="#00D9FF" />
            <Text style={styles.gridValue}>{user?.games_played || 0}</Text>
            <Text style={styles.gridLabel}>Games</Text>
          </View>
          <View style={styles.gridItem}>
            <Ionicons name="trophy" size={24} color="#FFD700" />
            <Text style={styles.gridValue}>{user?.games_won || 0}</Text>
            <Text style={styles.gridLabel}>Wins</Text>
          </View>
          <View style={styles.gridItem}>
            <Ionicons name="bulb" size={24} color="#2ECC71" />
            <Text style={styles.gridValue}>{user?.puzzles_solved || 0}</Text>
            <Text style={styles.gridLabel}>Puzzles</Text>
          </View>
          <View style={styles.gridItem}>
            <Ionicons name="analytics" size={24} color="#9B59B6" />
            <Text style={styles.gridValue}>{user?.puzzle_rating || 800}</Text>
            <Text style={styles.gridLabel}>Rating</Text>
          </View>
        </View>

        {/* Membership Tiers */}
        {!user?.is_owner && (
          <>
            <Text style={styles.sectionTitle}>Membership Plans</Text>
            {MEMBERSHIP_TIERS.map((tier) => (
              <TouchableOpacity
                key={tier.key}
                style={[
                  styles.tierCard,
                  user?.membership === tier.key && styles.tierCardActive,
                ]}
                onPress={() => handleUpgrade(tier.key)}
                disabled={user?.membership === tier.key}
              >
                <View style={styles.tierHeader}>
                  <View style={[styles.tierIcon, { backgroundColor: `${tier.color}20` }]}>
                    <Ionicons name="ribbon" size={24} color={tier.color} />
                  </View>
                  <View style={styles.tierInfo}>
                    <Text style={styles.tierName}>{tier.name}</Text>
                    <Text style={styles.tierPrice}>{tier.price}</Text>
                  </View>
                  {user?.membership === tier.key && (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>CURRENT</Text>
                    </View>
                  )}
                </View>
                <View style={styles.tierFeatures}>
                  {tier.features.map((feature, index) => (
                    <View key={index} style={styles.featureRow}>
                      <Ionicons name="checkmark-circle" size={16} color={tier.color} />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Owner Badge */}
        {user?.is_owner && (
          <View style={styles.ownerCard}>
            <Ionicons name="star" size={40} color="#FFD700" />
            <Text style={styles.ownerTitle}>Owner Account</Text>
            <Text style={styles.ownerDesc}>You have access to all features!</Text>
          </View>
        )}

        {/* Recent Games */}
        <Text style={styles.sectionTitle}>Recent Games</Text>
        {gameHistory.length > 0 ? (
          gameHistory.map((game, index) => (
            <View key={index} style={styles.gameItem}>
              <Ionicons
                name={game.status === 'checkmate' ? 'trophy' : 'game-controller'}
                size={20}
                color={game.winner === user?.user_id ? '#2ECC71' : '#E74C3C'}
              />
              <View style={styles.gameInfo}>
                <Text style={styles.gameMode}>
                  {game.mode === 'computer' ? `vs Computer (${game.ai_level})` : game.mode}
                </Text>
                <Text style={styles.gameStatus}>
                  {game.status} - {game.moves?.length || 0} moves
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noGames}>No games played yet</Text>
        )}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color="#E74C3C" />
          <Text style={styles.logoutText}>Logout</Text>
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
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  ownerBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFD700',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 12,
  },
  userEmail: {
    fontSize: 14,
    color: '#888888',
    marginTop: 4,
  },
  membershipTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 12,
  },
  membershipTagText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  gridItem: {
    width: '50%',
    alignItems: 'center',
    padding: 16,
  },
  gridValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  gridLabel: {
    fontSize: 12,
    color: '#888888',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  tierCard: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tierCardActive: {
    borderColor: '#FFD700',
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tierIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierInfo: {
    flex: 1,
    marginLeft: 12,
  },
  tierName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tierPrice: {
    fontSize: 14,
    color: '#888888',
  },
  currentBadge: {
    backgroundColor: '#FFD700',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  tierFeatures: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#CCCCCC',
    marginLeft: 8,
  },
  ownerCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  ownerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 12,
  },
  ownerDesc: {
    fontSize: 14,
    color: '#CCCCCC',
    marginTop: 4,
  },
  gameItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  gameInfo: {
    marginLeft: 12,
  },
  gameMode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  gameStatus: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
  },
  noGames: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    padding: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  logoutText: {
    fontSize: 16,
    color: '#E74C3C',
    fontWeight: '600',
    marginLeft: 8,
  },
});
