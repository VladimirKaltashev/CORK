-- =====================================================
-- Allow admins to verify/reject achievements
-- =====================================================

-- Table-level grant: authenticated users can UPDATE
GRANT UPDATE ON public.achievements TO authenticated;

-- Admin policy: admins can update any achievement
DROP POLICY IF EXISTS "achievements_update_admin" ON public.achievements;
CREATE POLICY "achievements_update_admin"
  ON public.achievements FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

NOTIFY pgrst, 'reload';
