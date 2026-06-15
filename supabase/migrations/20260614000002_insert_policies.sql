-- =====================================================
-- INSERT grants + RLS policies for authenticated users
-- =====================================================

-- Achievements: authenticated users can insert their own
GRANT INSERT ON public.achievements TO authenticated;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "achievements_insert_own" ON public.achievements;
CREATE POLICY "achievements_insert_own"
  ON public.achievements FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Comments: authenticated users can insert their own
GRANT INSERT ON public.comments TO authenticated;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comments_insert_own" ON public.comments;
CREATE POLICY "comments_insert_own"
  ON public.comments FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Reactions: authenticated users can insert their own
GRANT INSERT ON public.reactions TO authenticated;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reactions_insert_own" ON public.reactions;
CREATE POLICY "reactions_insert_own"
  ON public.reactions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Friends: authenticated users can insert (send request)
GRANT INSERT ON public.friends TO authenticated;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "friends_insert_own" ON public.friends;
CREATE POLICY "friends_insert_own"
  ON public.friends FOR INSERT
  WITH CHECK (user_id = auth.uid());
