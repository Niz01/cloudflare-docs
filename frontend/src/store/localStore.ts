import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const GOD_MODE_NAME = 'nzubechi';

interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  puzzlesSolved: number;
  puzzleRating: number;
  membership: string;
  username: string;
}

interface LocalState {
  stats: PlayerStats;
  isGodMode: boolean;
  loadStats: () => Promise<void>;
  incrementGames: (won: boolean) => Promise<void>;
  incrementPuzzles: (ratingChange: number) => Promise<void>;
  setMembership: (tier: string) => Promise<void>;
  setUsername: (name: string) => Promise<void>;
}

const DEFAULT_STATS: PlayerStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  puzzlesSolved: 0,
  puzzleRating: 800,
  membership: 'free',
  username: '',
};

export const useLocalStore = create<LocalState>((set, get) => ({
  stats: DEFAULT_STATS,
  isGodMode: false,

  loadStats: async () => {
    try {
      const raw = await AsyncStorage.getItem('chess_stats');
      if (raw) {
        const parsed = { ...DEFAULT_STATS, ...JSON.parse(raw) };
        const isGod = (parsed.username || '').toLowerCase() === GOD_MODE_NAME;
        if (isGod) parsed.membership = 'diamond';
        set({ stats: parsed, isGodMode: isGod });
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

  setUsername: async (name: string) => {
    const s = { ...get().stats, username: name };
    const isGod = name.toLowerCase() === GOD_MODE_NAME;
    if (isGod) s.membership = 'diamond';
    set({ stats: s, isGodMode: isGod });
    await AsyncStorage.setItem('chess_stats', JSON.stringify(s));
  },
}));
