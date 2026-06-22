-- =====================================================
-- Arena items view: live claims for server-side ranking
-- =====================================================

CREATE OR REPLACE VIEW public.arena_items
  WITH (security_invoker = true)
AS
WITH
  reaction_counts AS (
    SELECT
      achievement_id,
      COUNT(*) FILTER (WHERE kind = 'crown')::INT AS crowns,
      COUNT(*) FILTER (WHERE kind = 'clown')::INT AS clowns,
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
LEFT JOIN comment_counts cc ON cc.achievement_id = a.id
WHERE a.status IN ('pending', 'verified');

GRANT SELECT ON public.arena_items TO authenticated, anon;
