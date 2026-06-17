-- =====================================================
-- Add missing GRANT UPDATE / DELETE for friends table
-- (RLS policies exist, but table-level grants were missing)
-- =====================================================

GRANT UPDATE ON public.friends TO authenticated;
GRANT DELETE ON public.friends TO authenticated;

NOTIFY pgrst, 'reload';
