import { create } from 'zustand'
import { supabase } from '@/shared/lib/supabase'
import { showToast } from '@/shared/lib/toast'

export interface ScoutScore {
  userId: string
  userName: string
  avatar: string | null
  submittedCount: number
  scoutScore: number
  crownsBrought: number
  clownsBrought: number
  commentsBrought: number
}

interface ScoutState {
  topScouts: ScoutScore[]
  scores: Record<string, ScoutScore>
  loading: boolean
  loadTopScouts: (limit?: number) => Promise<void>
  loadScoutScore: (userId: string) => Promise<void>
}

function mapRow(row: Record<string, unknown>): ScoutScore {
  return {
    userId: String(row.user_id ?? ''),
    userName: String(row.user_name ?? ''),
    avatar: row.avatar ? String(row.avatar) : null,
    submittedCount: Number(row.submitted_count ?? 0),
    scoutScore: Number(row.scout_score ?? 0),
    crownsBrought: Number(row.crowns_brought ?? 0),
    clownsBrought: Number(row.clowns_brought ?? 0),
    commentsBrought: Number(row.comments_brought ?? 0),
  }
}

export const useScoutStore = create<ScoutState>((set) => ({
  topScouts: [],
  scores: {},
  loading: false,

  loadTopScouts: async (limit = 5) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('scout_scores')
        .select('*')
        .order('scout_score', { ascending: false })
        .limit(limit)
      if (error) {
        console.error('[scout] loadTopScouts error:', error)
        throw error
      }
      const top = (data ?? []).map((row) => mapRow(row as Record<string, unknown>))
      set({ topScouts: top, loading: false })
    } catch (err) {
      console.error('[scout] loadTopScouts catch:', err)
      showToast('error', 'Не удалось загрузить топ скаутов')
      set({ loading: false })
    }
  },

  loadScoutScore: async (userId) => {
    if (!userId) return
    try {
      const { data, error } = await supabase
        .from('scout_scores')
        .select('*')
        .eq('user_id', userId)
        .single()
      if (error) {
        console.error('[scout] loadScoutScore error:', error)
        throw error
      }
      const score = mapRow(data as Record<string, unknown>)
      set((s) => ({ scores: { ...s.scores, [userId]: score } }))
    } catch (err) {
      console.error('[scout] loadScoutScore catch:', err)
      showToast('error', 'Не удалось загрузить Scout Score')
    }
  },
}))
