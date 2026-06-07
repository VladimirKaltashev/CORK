-- =====================================================
-- Scout-lite: view scout_scores через CTE (без fanout)
-- =====================================================

-- 1. Счётчики реакций по achievement_id (без fanout)
-- 2. Счётчики комментариев по achievement_id (без fanout)
-- 3. Score per achievement
-- 4. Агрегация по author (achievements.user_id)

CREATE OR REPLACE VIEW public.scout_scores
  WITH (security_invoker = true)
AS
WITH
  reaction_counts AS (
    SELECT
      achievement_id,
      COUNT(*) FILTER (WHERE kind = 'crown')::INT AS crowns,
      COUNT(*) FILTER (WHERE kind = 'clown')::INT  AS clowns
    FROM public.reactions
    GROUP BY achievement_id
  ),
  comment_counts AS (
    SELECT
      achievement_id,
      COUNT(*)::INT AS comments
    FROM public.comments
    GROUP BY achievement_id
  ),
  achievement_scores AS (
    SELECT
      a.user_id,
      a.id AS achievement_id,
      COALESCE(rc.crowns, 0) AS crowns,
      COALESCE(rc.clowns, 0) AS clowns,
      COALESCE(cc.comments, 0) AS comments,
      -- formula:
      -- crowns * 2 + clowns * 2 + comments * 3 + controversy_bonus
      -- controversy_bonus = min(crowns, clowns) * 2 (если обе > 0)
      COALESCE(rc.crowns, 0) * 2
        + COALESCE(rc.clowns, 0) * 2
        + COALESCE(cc.comments, 0) * 3
        + CASE
            WHEN COALESCE(rc.crowns, 0) > 0 AND COALESCE(rc.clowns, 0) > 0
            THEN LEAST(COALESCE(rc.crowns, 0), COALESCE(rc.clowns, 0)) * 2
            ELSE 0
          END AS score
    FROM public.achievements a
    LEFT JOIN reaction_counts rc ON rc.achievement_id = a.id
    LEFT JOIN comment_counts cc ON cc.achievement_id = a.id
  )
SELECT
  p.id AS user_id,
  p.name AS user_name,
  p.avatar,
  COUNT(ascore.achievement_id)::INT AS submitted_count,
  COALESCE(SUM(ascore.score), 0)::INT AS scout_score,
  COALESCE(SUM(ascore.crowns), 0)::INT AS crowns_brought,
  COALESCE(SUM(ascore.clowns), 0)::INT AS clowns_brought,
  COALESCE(SUM(ascore.comments), 0)::INT AS comments_brought
FROM public.profiles p
LEFT JOIN achievement_scores ascore ON ascore.user_id = p.id
GROUP BY p.id, p.name, p.avatar;

GRANT SELECT ON public.scout_scores TO authenticated, anon;

-- =====================================================
-- Arena items view: честная сортировка без fanout
-- =====================================================

CREATE OR REPLACE VIEW public.arena_items
  WITH (security_invoker = true)
AS
WITH
  reaction_counts AS (
    SELECT
      achievement_id,
      COUNT(*) FILTER (WHERE kind = 'crown')::INT AS crowns,
      COUNT(*) FILTER (WHERE kind = 'clown')::INT  AS clowns,
      COUNT(*)::INT AS total_reactions
    FROM public.reactions
    GROUP BY achievement_id
  ),
  comment_counts AS (
    SELECT
      achievement_id,
      COUNT(*)::INT AS comments
    FROM public.comments
    GROUP BY achievement_id
  )
SELECT
  a.id,
  a.user_id,
  a.category,
  a.title,
  a.description,
  a.year,
  a.proof_type,
  a.proof_value,
  a.status,
  a.claim_angle,
  a.rejection_reason,
  a.meta,
  a.created_at,
  COALESCE(rc.crowns, 0) AS crowns,
  COALESCE(rc.clowns, 0) AS clowns,
  COALESCE(cc.comments, 0) AS comments,
  COALESCE(rc.total_reactions, 0) + COALESCE(cc.comments, 0) AS hot_score,
  CASE
    WHEN COALESCE(rc.crowns, 0) > 0 AND COALESCE(rc.clowns, 0) > 0
    THEN LEAST(rc.crowns, rc.clowns)
    ELSE 0
  END AS controversy_score
FROM public.achievements a
LEFT JOIN reaction_counts rc ON rc.achievement_id = a.id
LEFT JOIN comment_counts cc ON cc.achievement_id = a.id;

GRANT SELECT ON public.arena_items TO authenticated, anon;
