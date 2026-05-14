-- =====================================================
-- CORK: переход с likes на reactions (crown/clown)
-- + недельный бюджет, +  RPC toggle_reaction
-- =====================================================

DROP TABLE IF EXISTS public.likes CASCADE;

CREATE TABLE IF NOT EXISTS public.reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('crown', 'clown')),
  cost INT NOT NULL CHECK (cost > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(achievement_id, user_id)
);

CREATE INDEX IF NOT EXISTS reactions_achievement_idx ON public.reactions(achievement_id);
CREATE INDEX IF NOT EXISTS reactions_user_created_idx ON public.reactions(user_id, created_at);

ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reactions_select_all" ON public.reactions;
CREATE POLICY "reactions_select_all"
  ON public.reactions FOR SELECT
  USING (true);

-- Прямой INSERT/UPDATE/DELETE через клиента закрыт.
-- Все мутации идут через RPC public.toggle_reaction (SECURITY DEFINER).

-- =====================================================
-- RPC: toggle_reaction
-- Кнопка короны/клоуна вызывает её. Логика:
--   • нет реакции          → создать (-cost из бюджета)
--   • та же реакция        → удалить (toggle off, +cost обратно)
--   • другая реакция       → заменить (вернуть old_cost, списать new_cost)
-- Бюджет: 10 голосов на текущую календарную неделю (date_trunc('week', NOW())).
-- =====================================================
CREATE OR REPLACE FUNCTION public.toggle_reaction(
  p_achievement_id UUID,
  p_kind TEXT
) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_week_start TIMESTAMPTZ := date_trunc('week', NOW());
  v_existing public.reactions;
  v_had_existing BOOLEAN;
  v_new_cost INT;
  v_spend_excl INT;
  v_result_kind TEXT;
  v_total_spent INT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  IF p_kind NOT IN ('crown', 'clown') THEN
    RAISE EXCEPTION 'invalid kind: %', p_kind;
  END IF;

  v_new_cost := CASE p_kind WHEN 'crown' THEN 1 ELSE 2 END;

  SELECT * INTO v_existing
  FROM public.reactions
  WHERE achievement_id = p_achievement_id AND user_id = v_user_id;
  v_had_existing := FOUND;

  IF v_had_existing AND v_existing.kind = p_kind THEN
    DELETE FROM public.reactions WHERE id = v_existing.id;
    v_result_kind := NULL;

  ELSE
    SELECT COALESCE(SUM(cost), 0) INTO v_spend_excl
    FROM public.reactions
    WHERE user_id = v_user_id
      AND created_at >= v_week_start
      AND (NOT v_had_existing OR id <> v_existing.id);

    IF v_spend_excl + v_new_cost > 10 THEN
      RAISE EXCEPTION 'budget exceeded: spent=% need=% limit=10', v_spend_excl, v_new_cost;
    END IF;

    IF v_had_existing THEN
      UPDATE public.reactions
      SET kind = p_kind, cost = v_new_cost, created_at = NOW()
      WHERE id = v_existing.id;
    ELSE
      INSERT INTO public.reactions (achievement_id, user_id, kind, cost)
      VALUES (p_achievement_id, v_user_id, p_kind, v_new_cost);
    END IF;
    v_result_kind := p_kind;
  END IF;

  SELECT COALESCE(SUM(cost), 0) INTO v_total_spent
  FROM public.reactions
  WHERE user_id = v_user_id AND created_at >= v_week_start;

  RETURN jsonb_build_object(
    'kind', v_result_kind,
    'spent', v_total_spent,
    'remaining', GREATEST(10 - v_total_spent, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.toggle_reaction(UUID, TEXT) TO authenticated;

-- =====================================================
-- RPC: get_reaction_budget — остаток на этой неделе
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_reaction_budget()
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_week_start TIMESTAMPTZ := date_trunc('week', NOW());
  v_spent INT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT COALESCE(SUM(cost), 0) INTO v_spent
  FROM public.reactions
  WHERE user_id = v_user_id AND created_at >= v_week_start;

  RETURN jsonb_build_object(
    'spent', v_spent,
    'remaining', GREATEST(10 - v_spent, 0),
    'week_start', v_week_start
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_reaction_budget() TO authenticated;

-- =====================================================
-- VIEW: profile_scores — счётчики 👑/🤡 для каждого юзера
-- + name/avatar чтобы лидерборд тянулся одним запросом
-- =====================================================
CREATE OR REPLACE VIEW public.profile_scores AS
SELECT
  p.id AS user_id,
  p.name,
  p.avatar,
  COALESCE(SUM(CASE WHEN r.kind = 'crown' THEN 1 ELSE 0 END), 0)::INT AS crowns,
  COALESCE(SUM(CASE WHEN r.kind = 'clown' THEN 1 ELSE 0 END), 0)::INT AS clowns
FROM public.profiles p
LEFT JOIN public.achievements a ON a.user_id = p.id
LEFT JOIN public.reactions r ON r.achievement_id = a.id
GROUP BY p.id, p.name, p.avatar;

GRANT SELECT ON public.profile_scores TO authenticated, anon;
