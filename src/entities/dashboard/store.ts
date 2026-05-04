import { create } from 'zustand';
import type { DashboardStats, GlobalFeedEvent } from '@/shared/types';
import { api } from '@/shared/lib/api';

interface DashboardState {
  stats: DashboardStats | null;
  globalFeed: GlobalFeedEvent[];
  feedPage: number;
  hasMoreFeed: boolean;
  isLoadingStats: boolean;
  isLoadingFeed: boolean;
  loadStats: () => Promise<void>;
  loadGlobalFeed: (reset?: boolean) => Promise<void>;
  reset: () => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  stats: null,
  globalFeed: [],
  feedPage: 1,
  hasMoreFeed: true,
  isLoadingStats: false,
  isLoadingFeed: false,
  loadStats: async () => {
    set({ isLoadingStats: true });
    try {
      const response = await api.get('/dashboard/stats');
      set({ stats: response.data });
    } catch (e) {
      console.error(e);
    } finally {
      set({ isLoadingStats: false });
    }
  },
  loadGlobalFeed: async (reset = false) => {
    const currentPage = reset ? 1 : get().feedPage;
    if (get().isLoadingFeed || (!get().hasMoreFeed && !reset)) return;
    set({ isLoadingFeed: true });
    try {
      const response = await api.get('/feed/global', { params: { page: currentPage, limit: 10 } });
      const { items, hasMore } = response.data;
      set({
        globalFeed: reset ? items : [...get().globalFeed, ...items],
        feedPage: currentPage + 1,
        hasMoreFeed: hasMore,
      });
    } catch (e) {
      console.error(e);
    } finally {
      set({ isLoadingFeed: false });
    }
  },
  reset: () => set({ stats: null, globalFeed: [], feedPage: 1, hasMoreFeed: true, isLoadingStats: false, isLoadingFeed: false }),
}));