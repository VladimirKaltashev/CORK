-- =====================================================
-- Additional table grants for anon access
-- =====================================================

-- Achievements (needed for arena_items view)
GRANT SELECT ON public.achievements TO anon, authenticated;

-- Reactions (needed for profile_scores, arena_items)
GRANT SELECT ON public.reactions TO anon, authenticated;

-- Comments (needed for arena_items, comments feature)
GRANT SELECT ON public.comments TO anon, authenticated;

-- Friends
GRANT SELECT ON public.friends TO anon, authenticated;