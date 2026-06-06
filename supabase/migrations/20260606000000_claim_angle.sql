-- Добавить claim_angle к achievements
ALTER TABLE public.achievements
  ADD COLUMN IF NOT EXISTS claim_angle TEXT DEFAULT 'judge';

-- Backfill существующих записей в king (старые достижения)
UPDATE public.achievements
  SET claim_angle = 'king'
  WHERE claim_angle IS NULL OR claim_angle = '';

-- Check constraint: только king / clown / judge
ALTER TABLE public.achievements
  DROP CONSTRAINT IF EXISTS achievements_claim_angle_check;
ALTER TABLE public.achievements
  ADD CONSTRAINT achievements_claim_angle_check
  CHECK (claim_angle IN ('king', 'clown', 'judge'));

-- Default для новых строк
ALTER TABLE public.achievements
  ALTER COLUMN claim_angle SET DEFAULT 'judge';

-- NOT NULL после backfill
ALTER TABLE public.achievements
  ALTER COLUMN claim_angle SET NOT NULL;
