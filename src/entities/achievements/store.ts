import { create } from 'zustand';
import type { VerifiedAchievement } from '@/shared/types';

import { api } from '@/shared/lib/api';
import { showToast } from '@/shared/lib/toast';

interface AchievementsState {
  achievements: VerifiedAchievement[];
  isLoading: boolean;
  loadUserAchievements: (userId: string) => Promise<void>;
  verifyAchievement: (achievementId: string, verified: boolean) => Promise<boolean>;
  reset: () => void;
}

export const useAchievementsStore = create<AchievementsState>((set) => ({
  achievements: [],
  isLoading: false,
  loadUserAchievements: async (userId) => {
    set({ isLoading: true });
    try {
      const response = await api.get(`/user/${userId}/achievements`);
      set({ achievements: response.data.achievements });
    } catch {
      showToast('error', 'Не удалось загрузить достижения');
    } finally {
      set({ isLoading: false });
    }
  },
  verifyAchievement: async (achievementId, verified) => {
    try {
      const response = await api.post(`/api/achievements/${achievementId}/verify`, { verified });
      if (response.data.success) {
        set((state) => ({
          achievements: state.achievements.map((ach) =>
            ach.id === achievementId ? { ...ach, verified: verified ? 'verified' : 'rejected' } : ach
          ),
        }));
        showToast('success', verified ? 'Достижение верифицировано' : 'Достижение отклонено');
        return true;
      }
      return false;
    } catch (error: any) {
      showToast('error', error.response?.status === 403 ? 'Нет прав' : 'Ошибка верификации');
      return false;
    }
  },
  reset: () => set({ achievements: [], isLoading: false }),
}));