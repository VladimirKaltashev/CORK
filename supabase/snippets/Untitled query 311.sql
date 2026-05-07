 -- ── Таблицы ──────────────────────────────────────────────

CREATE TABLE public.profiles (
id UUID REFERENCES auth.users(id) PRIMARY KEY,
name TEXT NOT NULL,
bio TEXT,
contacts JSONB,
avatar TEXT,
is_admin BOOLEAN DEFAULT false,
registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.achievements (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
category TEXT NOT NULL,
title TEXT NOT NULL,
description TEXT NOT NULL,
year INT NOT NULL,
proof_type TEXT DEFAULT 'none',
proof_value TEXT,
status TEXT DEFAULT 'pending',
rejection_reason TEXT,
meta JSONB DEFAULT '{}',
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.likes (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE,
user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
UNIQUE(achievement_id, user_id)
);

-- ── Включить RLS ──────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- ── Политики: profiles ────────────────────────────────────

CREATE POLICY "Профили видят все"
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Профиль создаёт владелец"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Профиль редактирует владелец"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- ── Политики: achievements ────────────────────────────────

CREATE POLICY "Достижения видят все"
ON public.achievements FOR SELECT USING (true);

CREATE POLICY "Достижения добавляет владелец"
ON public.achievements FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Достижения обновляет владелец или админ"
ON public.achievements FOR UPDATE
USING (
auth.uid() = user_id
OR EXISTS (
SELECT 1 FROM public.profiles
WHERE id = auth.uid() AND is_admin = true
)
);

CREATE POLICY "Достижения удаляет владелец"
ON public.achievements FOR DELETE
USING (auth.uid() = user_id);

-- ── Политики: likes ───────────────────────────────────────

CREATE POLICY "Лайки видят все"
ON public.likes FOR SELECT USING (true);

CREATE POLICY "Лайк ставит авторизованный"
ON public.likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Лайк удаляет владелец"
ON public.likes FOR DELETE
USING (auth.uid() = user_id);

-- ── Автосоздание профиля при регистрации ─────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
INSERT INTO public.profiles (id, name, registered_at)
VALUES (
NEW.id,
COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
NOW()
);
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();