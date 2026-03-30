import axios from 'axios';
import { User, Game, Puzzle, OnlineMatch, TierInfo } from '../types';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth
export const authApi = {
  createSession: async (sessionId: string): Promise<User> => {
    const response = await api.post('/auth/session', { session_id: sessionId });
    return response.data;
  },
  
  getMe: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },
};

// User
export const userApi = {
  getProfile: async (): Promise<User & { tier_info: TierInfo }> => {
    const response = await api.get('/users/me');
    return response.data;
  },
  
  updateMembership: async (membership: string): Promise<User> => {
    const response = await api.put('/users/me/membership', { membership });
    return response.data;
  },
  
  getMembershipTiers: async (): Promise<Record<string, TierInfo>> => {
    const response = await api.get('/membership/tiers');
    return response.data;
  },
};

// Games
export const gameApi = {
  createGame: async (mode: string, aiLevel?: string): Promise<Game> => {
    const response = await api.post('/games', { mode, ai_level: aiLevel });
    return response.data;
  },
  
  getGame: async (gameId: string): Promise<Game> => {
    const response = await api.get(`/games/${gameId}`);
    return response.data;
  },
  
  makeMove: async (gameId: string, move: string, fen: string): Promise<{ success: boolean; fen: string }> => {
    const response = await api.put(`/games/${gameId}/move`, { move, fen });
    return response.data;
  },
  
  endGame: async (gameId: string, status: string, winner?: string): Promise<{ success: boolean }> => {
    const response = await api.put(`/games/${gameId}/end`, { status, winner });
    return response.data;
  },
  
  getHistory: async (): Promise<Game[]> => {
    const response = await api.get('/games/history/me');
    return response.data;
  },
};

// Matchmaking
export const matchmakingApi = {
  joinQueue: async (): Promise<OnlineMatch> => {
    const response = await api.post('/matchmaking/queue');
    return response.data;
  },
  
  getStatus: async (matchId: string): Promise<OnlineMatch> => {
    const response = await api.get(`/matchmaking/status/${matchId}`);
    return response.data;
  },
  
  leaveQueue: async (): Promise<void> => {
    await api.delete('/matchmaking/queue');
  },
};

// Puzzles
export const puzzleApi = {
  getPuzzles: async (difficulty?: string): Promise<Puzzle[]> => {
    const params = difficulty ? { difficulty } : {};
    const response = await api.get('/puzzles', { params });
    return response.data;
  },
  
  getRandomPuzzle: async (difficulty?: string): Promise<Puzzle> => {
    const params = difficulty ? { difficulty } : {};
    const response = await api.get('/puzzles/random', { params });
    return response.data;
  },
  
  getPuzzle: async (puzzleId: string): Promise<Puzzle> => {
    const response = await api.get(`/puzzles/${puzzleId}`);
    return response.data;
  },
  
  submitAttempt: async (
    puzzleId: string,
    solved: boolean,
    movesMade: string[],
    timeTaken: number
  ): Promise<{ success: boolean; new_rating: number }> => {
    const response = await api.post(`/puzzles/${puzzleId}/attempt`, {
      solved,
      moves_made: movesMade,
      time_taken: timeTaken,
    });
    return response.data;
  },
  
  getStats: async (): Promise<{
    total_attempts: number;
    solved: number;
    success_rate: number;
    rating: number;
  }> => {
    const response = await api.get('/puzzles/stats/me');
    return response.data;
  },
};

// Admin
export const adminApi = {
  seedPuzzles: async (): Promise<{ message: string }> => {
    const response = await api.post('/admin/seed-puzzles');
    return response.data;
  },
};

export default api;
