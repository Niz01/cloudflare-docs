import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  puzzlesSolved: number;
  puzzleRating: number;
  membership: string;
}

interface LocalState {
  stats: PlayerStats;
  loadStats: () => Promise<void>;
  incrementGames: (won: boolean) => Promise<void>;
  incrementPuzzles: (ratingChange: number) => Promise<void>;
  setMembership: (tier: string) => Promise<void>;
}

const DEFAULT_STATS: PlayerStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  puzzlesSolved: 0,
  puzzleRating: 800,
  membership: 'owner',
};

export const useLocalStore = create<LocalState>((set, get) => ({
  stats: DEFAULT_STATS,

  loadStats: async () => {
    try {
      const raw = await AsyncStorage.getItem('chess_stats');
      if (raw) {
        set({ stats: { ...DEFAULT_STATS, ...JSON.parse(raw) } });
      }
    } catch (e) {
      console.error('Failed to load stats', e);
    }
  },

  incrementGames: async (won: boolean) => {
    const s = { ...get().stats };
    s.gamesPlayed++;
    if (won) s.gamesWon++;
    set({ stats: s });
    await AsyncStorage.setItem('chess_stats', JSON.stringify(s));
  },

  incrementPuzzles: async (ratingChange: number) => {
    const s = { ...get().stats };
    s.puzzlesSolved++;
    s.puzzleRating = Math.max(100, s.puzzleRating + ratingChange);
    set({ stats: s });
    await AsyncStorage.setItem('chess_stats', JSON.stringify(s));
  },

  setMembership: async (tier: string) => {
    const s = { ...get().stats, membership: tier };
    set({ stats: s });
    await AsyncStorage.setItem('chess_stats', JSON.stringify(s));
  },
}));
