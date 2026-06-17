-- =====================================================
-- Fix missing SELECT policies for tables where RLS was
-- enabled in 20260614000002_insert_policies.sql
-- =====================================================

-- Achievements: everyone can read; only own insert
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "achievements_select_all" ON public.achievements;
CREATE POLICY "achievements_select_all"
  ON public.achievements FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "achievements_update_own" ON public.achievements;
CREATE POLICY "achievements_update_own"
  ON public.achievements FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "achievements_delete_own" ON public.achievements;
CREATE POLICY "achievements_delete_own"
  ON public.achievements FOR DELETE
  USING (user_id = auth.uid());

-- Friends: users can see their own friendships
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "friends_select_own" ON public.friends;
CREATE POLICY "friends_select_own"
  ON public.friends FOR SELECT
  USING (user_id = auth.uid() OR friend_id = auth.uid());

DROP POLICY IF EXISTS "friends_update_own" ON public.friends;
CREATE POLICY "friends_update_own"
  ON public.friends FOR UPDATE
  USING (user_id = auth.uid() OR friend_id = auth.uid())
  WITH CHECK (user_id = auth.uid() OR friend_id = auth.uid());

DROP POLICY IF EXISTS "friends_delete_own" ON public.friends;
CREATE POLICY "friends_delete_own"
  ON public.friends FOR DELETE
  USING (user_id = auth.uid() OR friend_id = auth.uid());

-- Reactions: everyone can read
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reactions_select_all" ON public.reactions;
CREATE POLICY "reactions_select_all"
  ON public.reactions FOR SELECT
  USING (true);

-- Comments: already has policies from 20260607000000_comments.sql
-- but ensure SELECT policy exists
DROP POLICY IF EXISTS "comments_select_all" ON public.comments;
CREATE POLICY "comments_select_all"
  ON public.comments FOR SELECT
  USING (true);

NOTIFY pgrst, 'reload';
