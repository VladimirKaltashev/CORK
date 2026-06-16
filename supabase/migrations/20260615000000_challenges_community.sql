-- =====================================================
-- Community-driven challenges system
-- =====================================================

-- ── Expert thresholds (configurable tiers) ────────────
CREATE TABLE IF NOT EXISTS public.expert_thresholds (
  tier          TEXT PRIMARY KEY,
  min_reactions INT NOT NULL,
  can_propose   BOOLEAN NOT NULL DEFAULT false,
  vote_power    INT NOT NULL DEFAULT 1,
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── Challenge proposals (community → vote → schedule) ─
CREATE TABLE IF NOT EXISTS public.challenge_proposals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  proposed_by     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'pending',
  votes_up        INT NOT NULL DEFAULT 0,
  votes_down      INT NOT NULL DEFAULT 0,
  scheduled_at    TIMESTAMP WITH TIME ZONE,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── Challenges ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.challenges (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT NOT NULL,
  proposal_id   UUID REFERENCES public.challenge_proposals(id) ON DELETE SET NULL,
  created_by    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  starts_at     TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at       TIMESTAMP WITH TIME ZONE NOT NULL,
  status        TEXT NOT NULL DEFAULT 'draft',
  config        JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── Challenge entries (1 living claim per user per challenge) ─
CREATE TABLE IF NOT EXISTS public.challenge_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id  UUID REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  claim_id      UUID REFERENCES public.achievements(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  version       INT NOT NULL DEFAULT 1,
  is_current    BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Only one active entry per user per challenge
CREATE UNIQUE INDEX IF NOT EXISTS challenge_entries_current_per_user_idx
  ON public.challenge_entries(challenge_id, user_id)
  WHERE is_current = true;

-- ── Challenge awards ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.challenge_awards (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id  UUID REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  award_type    TEXT NOT NULL,
  claim_id      UUID REFERENCES public.achievements(id) ON DELETE SET NULL,
  awarded_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS challenge_proposals_status_idx
  ON public.challenge_proposals(status);
CREATE INDEX IF NOT EXISTS challenge_proposals_proposed_by_idx
  ON public.challenge_proposals(proposed_by);
CREATE INDEX IF NOT EXISTS challenges_status_idx
  ON public.challenges(status);
CREATE INDEX IF NOT EXISTS challenges_created_by_idx
  ON public.challenges(created_by);
CREATE INDEX IF NOT EXISTS challenge_entries_challenge_id_idx
  ON public.challenge_entries(challenge_id);
CREATE INDEX IF NOT EXISTS challenge_entries_user_id_idx
  ON public.challenge_entries(user_id);
CREATE INDEX IF NOT EXISTS challenge_entries_claim_id_idx
  ON public.challenge_entries(claim_id);
CREATE INDEX IF NOT EXISTS challenge_awards_challenge_id_idx
  ON public.challenge_awards(challenge_id);

-- =====================================================
-- RLS + Grants
-- =====================================================

-- Expert thresholds: everyone can read; only admin can write
ALTER TABLE public.expert_thresholds ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.expert_thresholds TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.expert_thresholds TO authenticated;

DROP POLICY IF EXISTS "expert_thresholds_select_all" ON public.expert_thresholds;
CREATE POLICY "expert_thresholds_select_all"
  ON public.expert_thresholds FOR SELECT
  USING (true);

-- Challenge proposals
ALTER TABLE public.challenge_proposals ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.challenge_proposals TO anon, authenticated;
GRANT INSERT ON public.challenge_proposals TO authenticated;
GRANT UPDATE ON public.challenge_proposals TO authenticated;

DROP POLICY IF EXISTS "challenge_proposals_select_all" ON public.challenge_proposals;
CREATE POLICY "challenge_proposals_select_all"
  ON public.challenge_proposals FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "challenge_proposals_insert_own" ON public.challenge_proposals;
CREATE POLICY "challenge_proposals_insert_own"
  ON public.challenge_proposals FOR INSERT
  WITH CHECK (proposed_by = auth.uid());

DROP POLICY IF EXISTS "challenge_proposals_update_own" ON public.challenge_proposals;
CREATE POLICY "challenge_proposals_update_own"
  ON public.challenge_proposals FOR UPDATE
  USING (proposed_by = auth.uid())
  WITH CHECK (proposed_by = auth.uid());

-- Challenges
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.challenges TO anon, authenticated;
GRANT INSERT ON public.challenges TO authenticated;

DROP POLICY IF EXISTS "challenges_select_all" ON public.challenges;
CREATE POLICY "challenges_select_all"
  ON public.challenges FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "challenges_insert_admin" ON public.challenges;
CREATE POLICY "challenges_insert_admin"
  ON public.challenges FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Challenge entries
ALTER TABLE public.challenge_entries ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.challenge_entries TO anon, authenticated;
GRANT INSERT ON public.challenge_entries TO authenticated;
GRANT UPDATE ON public.challenge_entries TO authenticated;
GRANT DELETE ON public.challenge_entries TO authenticated;

DROP POLICY IF EXISTS "challenge_entries_select_all" ON public.challenge_entries;
CREATE POLICY "challenge_entries_select_all"
  ON public.challenge_entries FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "challenge_entries_insert_own" ON public.challenge_entries;
CREATE POLICY "challenge_entries_insert_own"
  ON public.challenge_entries FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "challenge_entries_update_own" ON public.challenge_entries;
CREATE POLICY "challenge_entries_update_own"
  ON public.challenge_entries FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "challenge_entries_delete_own" ON public.challenge_entries;
CREATE POLICY "challenge_entries_delete_own"
  ON public.challenge_entries FOR DELETE
  USING (user_id = auth.uid());

-- Challenge awards
ALTER TABLE public.challenge_awards ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.challenge_awards TO anon, authenticated;
GRANT INSERT ON public.challenge_awards TO authenticated;

DROP POLICY IF EXISTS "challenge_awards_select_all" ON public.challenge_awards;
CREATE POLICY "challenge_awards_select_all"
  ON public.challenge_awards FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "challenge_awards_insert_admin" ON public.challenge_awards;
CREATE POLICY "challenge_awards_insert_admin"
  ON public.challenge_awards FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- =====================================================
-- Seed default expert thresholds
-- =====================================================
INSERT INTO public.expert_thresholds (tier, min_reactions, can_propose, vote_power)
VALUES
  ('bronze',  5,   false, 1),
  ('silver',  20,  true,  1),
  ('gold',    50,  true,  2),
  ('platinum', 100, true,  3)
ON CONFLICT (tier) DO NOTHING;

-- =====================================================
-- Notify PostgREST to reload schema cache
-- =====================================================
NOTIFY pgrst, 'reload';
