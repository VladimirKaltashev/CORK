-- =====================================================
-- Comments MVP — комментарии как аргументы суда
-- =====================================================

CREATE TABLE IF NOT EXISTS public.comments (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  user_id        uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body           text NOT NULL,
  side           text NOT NULL DEFAULT 'neutral',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz
);

-- Check constraint
ALTER TABLE public.comments
  DROP CONSTRAINT IF EXISTS comments_side_check;
ALTER TABLE public.comments
  ADD CONSTRAINT comments_side_check
  CHECK (side IN ('crown', 'clown', 'neutral'));

-- Indexes
CREATE INDEX IF NOT EXISTS comments_achievement_id_created_at_idx
  ON public.comments(achievement_id, created_at DESC);
CREATE INDEX IF NOT EXISTS comments_user_id_idx
  ON public.comments(user_id);

-- RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_select_all" ON public.comments;
CREATE POLICY "comments_select_all" ON public.comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "comments_insert_own" ON public.comments;
CREATE POLICY "comments_insert_own" ON public.comments
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "comments_update_own" ON public.comments;
CREATE POLICY "comments_update_own" ON public.comments
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "comments_delete_own" ON public.comments;
CREATE POLICY "comments_delete_own" ON public.comments
  FOR DELETE USING (user_id = auth.uid());
