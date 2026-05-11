-- ── Таблица friends ───────────────────────────────────────

CREATE TABLE public.friends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'accepted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

-- Все видят свои записи (входящие и исходящие)
CREATE POLICY "Видеть свои дружбы"
ON public.friends FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Отправить заявку может только авторизованный (себе = user_id)
CREATE POLICY "Отправить заявку"
ON public.friends FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Принять заявку может только получатель
CREATE POLICY "Принять заявку"
ON public.friends FOR UPDATE
USING (auth.uid() = friend_id);

-- Удалить запись может любая из сторон
CREATE POLICY "Удалить дружбу"
ON public.friends FOR DELETE
USING (auth.uid() = user_id OR auth.uid() = friend_id);
