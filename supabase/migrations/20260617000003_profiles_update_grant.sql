-- =====================================================
-- Grant UPDATE on profiles so RLS policy can evaluate
-- =====================================================
-- Without this table-level grant, Supabase rejects the
-- UPDATE before the RLS policy (profiles_update_own)
-- even gets to evaluate.  The policy still limits
-- updates to rows where id = auth.uid().
-- =====================================================

GRANT UPDATE ON public.profiles TO authenticated;
