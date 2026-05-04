import { create } from 'zustand';
import type { LeaderboardEntry, LeaderboardQuery, Subject } from '@/shared/types';
import { api } from '@/shared/lib/api';

interface LeaderboardState {
  entries: LeaderboardEntry[];
  total: number;
  currentSubject: Subject;
  currentPeriod: 'week' | 'month' | 'all';
  isLoading: boolean;
  loadLeaderboard: (query?: Partial<LeaderboardQuery>) => Promise<void>;
  setSubject: (subject: Subject) => void;
  setPeriod: (period: 'week' | 'month' | 'all') => void;
  reset: () => void;
}

export const useLeaderboardStore = create<LeaderboardState>((set, get) => ({
  entries: [],
  total: 0,
  currentSubject: 'math',
  currentPeriod: 'month',
  isLoading: false,
  loadLeaderboard: async (query = {}) => {
    const subject = query.subject ?? get().currentSubject;
    const period = query.period ?? get().currentPeriod;
    set({ isLoading: true });
    try {
      const response = await api.get('/leaderboard', { params: { subject, period, limit: 20 } });
      set({ entries: response.data.entries, total: response.data.total, currentSubject: subject, currentPeriod: period });
    } catch (e) {
      console.error(e);
    } finally {
      set({ isLoading: false });
    }
  },
  setSubject: (subject) => { set({ currentSubject: subject }); get().loadLeaderboard({ subject }); },
  setPeriod: (period) => { set({ currentPeriod: period }); get().loadLeaderboard({ period }); },
  reset: () => set({ entries: [], total: 0, currentSubject: 'math', currentPeriod: 'month', isLoading: false }),
}));