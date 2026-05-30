-- =====================================================
-- ОЧИСТКА (правильный порядок)
-- =====================================================
TRUNCATE TABLE public.reactions CASCADE;
TRUNCATE TABLE public.achievements CASCADE;
TRUNCATE TABLE public.friends CASCADE;
TRUNCATE TABLE public.profiles CASCADE;
TRUNCATE TABLE auth.users CASCADE;

-- =====================================================
-- РАСШИРЕНИЯ
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- Отключаем триггеры на время сидинга,
-- чтобы ручная вставка в profiles не конфликтовала
-- с авто-вставкой через handle_new_user.
-- session_replication_role = replica глушит обычные триггеры
-- на уровне сессии и не требует владения таблицей auth.users.
-- =====================================================
SET session_replication_role = replica;

-- =====================================================
-- ВСТАВКА В auth.users (49 пользователей)
-- =====================================================
DO $$
DECLARE
  emails TEXT[] := ARRAY['alexey.ivanov@test.com', 'maria.petrova@test.com', 'dmitry.smirnov@test.com', 'elena.kozlova@test.com', 'sergey.morozov@test.com', 'anna.vasilyeva@test.com', 'pavel.novikov@test.com', 'olga.fedorova@test.com', 'ilya.titov@test.com', 'natalia.kuznetsova@test.com', 'vladimir.sokolov@test.com', 'ekaterina.mikhailova@test.com', 'andrey.popov@test.com', 'tatiana.vorobieva@test.com', 'maxim.grigoriev@test.com', 'yulia.lebedev@test.com', 'nikita.egorov@test.com', 'irina.pavlova@test.com', 'artem.frolov@test.com', 'svetlana.dmitrieva@test.com', 'evgeny.nikolaev@test.com', 'oksana.semenova@test.com', 'roman.borisov@test.com', 'daria.kiselyova@test.com', 'konstantin.stepanov@test.com', 'alisa.orlova@test.com', 'danil.zakharov@test.com', 'veronika.belyaeva@test.com', 'sergey.timofeev@test.com', 'anastasia.solovieva@test.com', 'grigory.vasilyev@test.com', 'kseniya.afanasyeva@test.com', 'fedor.morozov@test.com', 'lyudmila.krylova@test.com', 'anton.belov@test.com', 'elizaveta.koroleva@test.com', 'nikolay.filatov@test.com', 'oleg.martynov@test.com', 'nadezhda.grisha@test.com', 'vadim.polyakov@test.com', 'aleksandra.tarasova@test.com', 'valentin.lavrov@test.com', 'yana.davydova@test.com', 'ruslan.chernyshov@test.com', 'inna.kulikova@test.com', 'vyacheslav.panov@test.com', 'alina.gavrilova@test.com', 'eduard.fomin@test.com', 'larisa.medvedeva@test.com'];
  names TEXT[] := ARRAY['Алексей Иванов', 'Мария Петрова', 'Дмитрий Смирнов', 'Елена Козлова', 'Сергей Морозов', 'Анна Васильева', 'Павел Новиков', 'Ольга Фёдорова', 'Илья Титов', 'Наталья Кузнецова', 'Владимир Соколов', 'Екатерина Михайлова', 'Андрей Попов', 'Татьяна Воробьёва', 'Максим Григорьев', 'Юлия Лебедева', 'Никита Егоров', 'Ирина Павлова', 'Артём Фролов', 'Светлана Дмитриева', 'Евгений Николаев', 'Оксана Семёнова', 'Роман Борисов', 'Дарья Киселёва', 'Константин Степанов', 'Алиса Орлова', 'Данил Захаров', 'Вероника Беляева', 'Сергей Тимофеев', 'Анастасия Соловьёва', 'Григорий Васильев', 'Ксения Афанасьева', 'Фёдор Морозов', 'Людмила Крылова', 'Антон Белов', 'Елизавета Королёва', 'Николай Филатов', 'Олег Мартынов', 'Надежда Гришина', 'Вадим Поляков', 'Александра Тарасова', 'Валентин Лавров', 'Яна Давыдова', 'Руслан Чернышёв', 'Инна Куликова', 'Вячеслав Панов', 'Алина Гаврилова', 'Эдуард Фомин', 'Лариса Медведева'];
  i INT;
  uid UUID;
BEGIN
  FOR i IN 1..array_length(emails, 1) LOOP
    uid := gen_random_uuid();
    
    -- Вставка в auth.users
    INSERT INTO auth.users (
      id, instance_id, aud, role, email,
      encrypted_password, email_confirmed_at, confirmation_sent_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      uid,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      emails[i],
      crypt('Test123456', gen_salt('bf')),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}'::JSONB,
      jsonb_build_object('name', names[i]),
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    );
    
    -- Вставка в profiles
    INSERT INTO public.profiles (id, name, email, registered_at, is_admin)
    VALUES (
      uid,
      names[i],
      emails[i],
      NOW(),
      (emails[i] = 'natalia.kuznetsova@test.com')
    );
  END LOOP;
END;
$$;

-- =====================================================
-- ОБНОВЛЕНИЕ BIO (профили)
-- =====================================================
UPDATE public.profiles SET bio = 'Увлекаюсь математикой и программированием. Участник олимпиад.' WHERE email = 'alexey.ivanov@test.com';
UPDATE public.profiles SET bio = 'Химия и биология — моё призвание. Люблю эксперименты.' WHERE email = 'maria.petrova@test.com';
UPDATE public.profiles SET bio = 'Физика и олимпиадные задачи. Мечтаю стать инженером.' WHERE email = 'dmitry.smirnov@test.com';
UPDATE public.profiles SET bio = 'Веб-разработка, дизайн, хакатоны.' WHERE email = 'elena.kozlova@test.com';
UPDATE public.profiles SET bio = 'История и английский. Хочу стать переводчиком.' WHERE email = 'sergey.morozov@test.com';
UPDATE public.profiles SET bio = 'Рисую, занимаюсь иллюстрацией.' WHERE email = 'anna.vasilyeva@test.com';
UPDATE public.profiles SET bio = 'Спорт, футбол, плавание. КМС по лёгкой атлетике.' WHERE email = 'pavel.novikov@test.com';
UPDATE public.profiles SET bio = 'Python, анализ данных, машинное обучение.' WHERE email = 'olga.fedorova@test.com';
UPDATE public.profiles SET bio = 'Шахматы, математика, логические задачи.' WHERE email = 'ilya.titov@test.com';
UPDATE public.profiles SET bio = 'Биология, экология, защита природы.' WHERE email = 'natalia.kuznetsova@test.com';
UPDATE public.profiles SET bio = 'Физика, астрономия. Люблю смотреть на звёзды.' WHERE email = 'vladimir.sokolov@test.com';
-- (добавь остальные bio по желанию)

-- =====================================================
-- ДОСТИЖЕНИЯ (80 штук, 8 категорий × 10)
-- Категории: olympiad, academic, it, creative, sport, movies, games, other
-- =====================================================
INSERT INTO public.achievements (id, user_id, category, title, description, year, proof_type, proof_value, status, created_at) VALUES

-- OLYMPIAD (10)
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'alexey.ivanov@test.com'),      'olympiad', 'Победитель ВсОШ по математике',           'Занял 1 место на региональном этапе всероссийской олимпиады',   2025, 'photo', '',                                   'verified', '2025-04-15 10:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'maria.petrova@test.com'),       'olympiad', 'Призёр олимпиады по химии',                '3 место на городской олимпиаде',                                2024, 'link',  'https://example.com/diplom/chemi/3',  'verified', '2025-04-10 12:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'dmitry.smirnov@test.com'),      'olympiad', 'Победитель этапа по физике',               'Решил все задачи, набрал максимум баллов',                      2025, 'none',  NULL,                                  'verified', '2025-03-20 09:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'elena.kozlova@test.com'),       'olympiad', 'Участник олимпиады по информатике',         'Прошёл на региональный этап',                                   2024, 'none',  NULL,                                  'verified', '2025-04-05 14:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'sergey.morozov@test.com'),      'olympiad', 'Победитель олимпиады по английскому',       '1 место в лингвистической олимпиаде',                           2025, 'link',  'https://example.com/diplom/eng/1',    'verified', '2025-04-12 11:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'anna.vasilyeva@test.com'),      'olympiad', 'Всероссийская олимпиада по искусству',      'Участие в финале',                                              2024, 'photo', '',                                   'verified', '2025-03-25 16:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'pavel.novikov@test.com'),       'olympiad', 'Олимпиада по физкультуре',                  '2 место в теоретическом туре',                                  2025, 'none',  NULL,                                  'verified', '2025-04-18 13:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'olga.fedorova@test.com'),       'olympiad', 'Кубок по программированию',                 '3 место в командном зачёте',                                    2025, 'link',  'https://example.com/code/3',          'verified', '2025-04-20 10:30:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'ilya.titov@test.com'),          'olympiad', 'Шахматная олимпиада',                       '1 место в школьном турнире',                                    2024, 'photo', '',                                   'verified', '2025-04-01 09:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'natalia.kuznetsova@test.com'),  'olympiad', 'Олимпиада по биологии',                     'Призёр заключительного этапа',                                  2025, 'link',  'https://example.com/bio/prize',       'verified', '2025-04-08 14:30:00'),

-- ACADEMIC (10)
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'alexey.ivanov@test.com'),      'academic', 'Золотая медаль выпускника',                'Окончил школу с золотой медалью, средний балл 5.0',             2025, 'photo', '',                                   'verified', '2025-06-01 10:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'maria.petrova@test.com'),       'academic', 'Победитель научной конференции',            '1 место на региональной конференции по химии',                  2024, 'link',  'https://example.com/conf/chem',       'verified', '2025-02-15 11:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'dmitry.smirnov@test.com'),      'academic', 'Стипендия им. Ломоносова',                 'Назначена за выдающиеся успехи в физике и математике',         2025, 'none',  NULL,                                  'verified', '2025-01-20 09:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'elena.kozlova@test.com'),       'academic', 'Грант на исследование UI/UX',               'Получила грант фонда цифровых инноваций на проект',             2024, 'link',  'https://example.com/grant/ui',        'verified', '2024-11-10 14:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'natalia.kuznetsova@test.com'),  'academic', 'Публикация в научном журнале',              'Соавтор статьи об экологии в журнале "Юный учёный"',            2025, 'link',  'https://example.com/journal/eco',     'verified', '2025-03-05 12:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'ilya.titov@test.com'),          'academic', 'Победитель математической регаты',          '1 место в командном зачёте, решено 12 из 12 задач',             2024, 'photo', '',                                   'verified', '2024-10-18 09:30:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'vladimir.sokolov@test.com'),    'academic', 'Грант астрономического общества',           'Финансирование личного проекта по наблюдению комет',            2025, 'none',  NULL,                                  'verified', '2025-02-28 11:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'ekaterina.mikhailova@test.com'),'academic', 'Сертификат IELTS C1',                       'Сдала IELTS на 7.5 баллов, уровень C1',                         2024, 'photo', '',                                   'verified', '2024-09-15 10:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'elizaveta.koroleva@test.com'),  'academic', 'Стипендия экономического факультета',       'Лучший результат по ЕГЭ среди абитуриентов потока',             2025, 'link',  'https://example.com/stip/econ',       'verified', '2025-07-01 09:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'konstantin.stepanov@test.com'), 'academic', 'Победитель конкурса исследовательских работ','Тема: "Генетические маркеры устойчивости к антибиотикам"',      2024, 'link',  'https://example.com/research/gen',    'verified', '2024-12-20 14:30:00'),

-- IT (10)
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'artem.frolov@test.com'),        'it', 'Победитель CTF-соревнования',               '1 место в школьной лиге по кибербезопасности',                  2025, 'link',  'https://example.com/ctf/winner',      'verified', '2025-04-25 14:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'ruslan.chernyshov@test.com'),    'it', 'Победитель хакатона',                        'React-приложение за 24 часа, 1 место из 30 команд',             2025, 'photo', '',                                   'verified', '2025-03-10 18:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'nikolay.filatov@test.com'),     'it', 'Open-source вклад',                          'Принят pull request в популярный репозиторий на GitHub',        2024, 'link',  'https://github.com/example/pr/42',    'verified', '2024-11-05 16:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'fedor.morozov@test.com'),       'it', 'Игра опубликована в Steam',                  'Инди-игра набрала 500 загрузок за первую неделю',               2025, 'link',  'https://store.steampowered.com/ex',   'verified', '2025-01-30 12:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'andrey.popov@test.com'),        'it', 'Победитель соревнования роботов',            '1 место в школьной лиге по робототехнике',                      2024, 'photo', '',                                   'verified', '2024-10-20 13:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'alisa.orlova@test.com'),        'it', 'Лучший UI/UX на конкурсе',                   'Победитель регионального конкурса веб-дизайна',                 2025, 'link',  'https://example.com/design/award',    'verified', '2025-02-14 10:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'olga.fedorova@test.com'),       'it', 'Kaggle Bronze Medal',                        'Бронзовая медаль в соревновании по машинному обучению',         2024, 'link',  'https://kaggle.com/competitions/ex',  'verified', '2024-08-22 09:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'vyacheslav.panov@test.com'),    'it', 'Призёр олимпиады по криптографии',          '2 место в олимпиаде по защите информации',                      2025, 'none',  NULL,                                  'verified', '2025-03-28 11:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'evgeny.nikolaev@test.com'),     'it', 'Решено 200 задач на Codeforces',             'Достиг рейтинга 1600, получил звание Expert',                   2024, 'link',  'https://codeforces.com/profile/ex',   'verified', '2024-12-01 15:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'danil.zakharov@test.com'),      'it', 'Сайт для НКО',                               'Разработал бесплатно сайт для местного экологического фонда',  2025, 'link',  'https://example-nko.ru',              'verified', '2025-01-15 14:00:00'),

-- CREATIVE (10)
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'anna.vasilyeva@test.com'),      'creative', 'Персональная выставка работ',             'Выставка иллюстраций в городской галерее, 300 посетителей',     2025, 'photo', '',                                   'verified', '2025-03-20 12:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'yana.davydova@test.com'),       'creative', 'Призёр конкурса скульптуры',             '2 место на региональном конкурсе молодых скульпторов',          2024, 'photo', '',                                   'verified', '2024-11-15 10:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'anastasia.solovieva@test.com'), 'creative', 'Лучшая роль на театральном фестивале',   'Приз зрительских симпатий за главную роль',                     2025, 'photo', '',                                   'verified', '2025-02-28 19:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'kseniya.afanasyeva@test.com'),  'creative', 'Победитель вокального конкурса',          '1 место в городском конкурсе академического вокала',            2025, 'link',  'https://example.com/vocal/1',         'verified', '2025-04-05 16:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'tatiana.vorobieva@test.com'),   'creative', 'Лауреат конкурса пианистов',              'Диплом 1 степени на региональном конкурсе им. Рахманинова',     2024, 'link',  'https://example.com/piano/laureate',  'verified', '2024-10-10 14:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'irina.pavlova@test.com'),       'creative', 'Победитель фотоконкурса',                 '1 место в категории «Городской пейзаж» на Nikon Contest',       2025, 'link',  'https://example.com/photo/nikon',     'verified', '2025-01-22 11:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'veronika.belyaeva@test.com'),   'creative', 'Победитель литературного конкурса',       'Рассказ опубликован в сборнике молодых авторов',                2025, 'link',  'https://example.com/lit/publish',     'verified', '2025-03-15 09:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'elena.kozlova@test.com'),       'creative', 'Победитель конкурса веб-дизайна',         'Лучший UX среди школьных проектов в регионе',                   2024, 'link',  'https://example.com/webdesign/1',     'verified', '2024-12-05 13:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'alina.gavrilova@test.com'),     'creative', 'Лауреат хореографического фестиваля',     '2 место в номинации «Современный танец»',                        2025, 'photo', '',                                   'verified', '2025-04-12 17:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'yulia.lebedev@test.com'),       'creative', 'Публикация стихов в журнале',             'Три стихотворения опубликованы в «Юном литераторе»',            2024, 'photo', '',                                   'verified', '2024-09-01 10:00:00'),

-- SPORT (10)
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'pavel.novikov@test.com'),       'sport', 'КМС по лёгкой атлетике',                  'Выполнил норматив кандидата в мастера спорта на 100м',          2025, 'photo', '',                                   'verified', '2025-05-10 11:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'danil.zakharov@test.com'),      'sport', 'Победитель городской лиги по футболу',     'Команда заняла 1 место, сам забил 8 голов за сезон',            2025, 'photo', '',                                   'verified', '2025-05-20 18:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'nikita.egorov@test.com'),       'sport', 'Чемпион школы по баскетболу',              'Капитан команды-победителя первенства города',                  2025, 'photo', '',                                   'verified', '2025-03-30 16:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'anton.belov@test.com'),         'sport', 'КМС по боксу',                             'Выполнил норматив на первенстве области, 3 победы нокаутом',    2024, 'photo', '',                                   'verified', '2024-11-25 14:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'valentin.lavrov@test.com'),     'sport', 'Победитель первенства по волейболу',        '1 место среди школьных команд, лучший пасующий турнира',        2025, 'photo', '',                                   'verified', '2025-02-20 15:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'roman.borisov@test.com'),       'sport', 'Победитель научно-спортивного конкурса',   '2 место в экспериментальном туре олимпиады по физкультуре',     2025, 'none',  NULL,                                  'verified', '2025-04-18 10:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'daria.kiselyova@test.com'),     'sport', 'Призёр первенства области по танцам',      '3 место в категории «Спортивные бальные танцы»',                 2024, 'photo', '',                                   'verified', '2024-10-05 17:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'alexey.ivanov@test.com'),       'sport', 'Чемпион школы по плаванию',                '1 место на дистанции 200м вольным стилем',                      2024, 'photo', '',                                   'verified', '2024-09-28 09:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'oleg.martynov@test.com'),       'sport', 'Победитель туристического слёта',          '1 место в командном зачёте, ориентирование на местности',       2025, 'photo', '',                                   'verified', '2025-06-15 14:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'inna.kulikova@test.com'),       'sport', 'Финишер городского марафона',              'Пробежала 42 км, время 4:12, лучшая среди школьниц',            2025, 'link',  'https://example.com/marathon/result', 'verified', '2025-05-05 12:00:00'),

-- MOVIES (10)
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'veronika.belyaeva@test.com'),   'movies', 'Призёр конкурса кинорецензий',             '2 место в конкурсе критиков «Первый кадр»',                     2025, 'link',  'https://example.com/film/review',     'verified', '2025-02-10 13:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'anastasia.solovieva@test.com'), 'movies', 'Победитель школьного кинофестиваля',       'Короткометражка «Последний урок» — лучший фильм фестиваля',     2024, 'link',  'https://example.com/kinofest/best',   'verified', '2024-12-10 19:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'tatiana.vorobieva@test.com'),   'movies', 'Победитель конкурса сценариев',            '1 место за короткометражный сценарий «Тишина»',                 2025, 'none',  NULL,                                  'verified', '2025-01-30 11:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'maxim.grigoriev@test.com'),     'movies', 'Авторская документалка об экологии',       'Фильм показан на областном эко-форуме, 400 просмотров',         2025, 'link',  'https://example.com/doc/eco',         'verified', '2025-03-25 14:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'irina.pavlova@test.com'),       'movies', 'Публикация фото в журнале',                'Серия снимков принята в ежегодный фотоальбом «Россия молодая»', 2024, 'photo', '',                                   'verified', '2024-11-20 10:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'yana.davydova@test.com'),       'movies', 'Видеоарт на городской выставке',           'Инсталляция показана в культурном центре в течение месяца',     2025, 'photo', '',                                   'verified', '2025-04-01 16:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'nadezhda.grisha@test.com'),     'movies', 'Победитель конкурса журналистики',         '1 место за репортаж о молодёжных инициативах в регионе',        2025, 'link',  'https://example.com/journ/award',     'verified', '2025-03-12 09:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'lyudmila.krylova@test.com'),    'movies', 'Автор документального фильма',             'Фильм об истории старинной усадьбы победил на конкурсе',        2024, 'link',  'https://example.com/doc/history',     'verified', '2024-10-15 13:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'aleksandra.tarasova@test.com'), 'movies', 'Эко-видео на Всероссийском конкурсе',      'Ролик о сортировке мусора собрал 15 000 просмотров',            2025, 'link',  'https://example.com/eco/video',       'verified', '2025-02-05 11:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'anna.vasilyeva@test.com'),      'movies', 'Победитель конкурса иллюстраций к фильму', 'Работа выбрана для официального постера регионального фестиваля',2024, 'photo', '',                                   'verified', '2024-09-20 12:00:00'),

-- GAMES (10)
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'fedor.morozov@test.com'),       'games', 'Разработал игру-победитель геймджема',      '1 место на 72-часовом GameJam, тема «Время»',                   2025, 'link',  'https://itch.io/jam/ex/entries/1',    'verified', '2025-01-20 12:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'ilya.titov@test.com'),          'games', 'Чемпион шахматного турнира онлайн',         '1 место в Lichess Swiss Tournament, 7 побед из 7',              2025, 'link',  'https://lichess.org/tournament/ex',   'verified', '2025-03-08 15:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'evgeny.nikolaev@test.com'),     'games', 'Победитель олимпиады по логике',            '1 место в городском турнире «Шахматы и математика»',            2024, 'photo', '',                                   'verified', '2024-11-10 10:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'artem.frolov@test.com'),        'games', 'Победитель CTF Capture the Flag',           '1 место в командном зачёте регионального CTF-турнира',          2025, 'link',  'https://example.com/ctf/2025',        'verified', '2025-04-10 18:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'ruslan.chernyshov@test.com'),   'games', 'Победитель игрового хакатона',              'Лучший игровой прототип за 48 часов на Unity',                  2024, 'photo', '',                                   'verified', '2024-12-15 17:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'vyacheslav.panov@test.com'),    'games', 'Призёр олимпиады по шифрованию',            '2 место в задаче на взлом криптографической головоломки',       2025, 'none',  NULL,                                  'verified', '2025-02-20 11:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'andrey.popov@test.com'),        'games', 'Победитель турнира по алгоритмам',          '1 место в школьном конкурсе «Лучший алгоритм»',                 2024, 'link',  'https://example.com/algo/school',     'verified', '2024-10-25 14:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'vadim.polyakov@test.com'),      'games', 'Победитель математических игр',             '1 место в городских «Математических боях»',                     2025, 'photo', '',                                   'verified', '2025-03-18 16:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'elizaveta.koroleva@test.com'),  'games', 'Победитель бизнес-симулятора',              '1 место в школьной игре-симуляторе фондового рынка',            2024, 'link',  'https://example.com/bizgame/1',       'verified', '2024-11-30 13:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'nikita.egorov@test.com'),       'games', 'Победитель спортивного киберсоревнования',  '1 место в школьном турнире по спортивным симуляторам',          2025, 'none',  NULL,                                  'verified', '2025-01-25 15:00:00'),

-- OTHER (10)
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'natalia.kuznetsova@test.com'),  'other', 'Организатор эко-субботника',               'Организовала уборку парка, 120 участников, 3 тонны мусора',     2025, 'photo', '',                                   'verified', '2025-04-22 10:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'konstantin.stepanov@test.com'), 'other', 'Волонтёр в детском доме',                  'Регулярный волонтёр на протяжении двух лет',                    2024, 'none',  NULL,                                  'verified', '2024-09-01 09:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'svetlana.dmitrieva@test.com'),  'other', 'Участник научно-географической экспедиции', 'Исследование флоры Байкала в составе молодёжного отряда',       2025, 'photo', '',                                   'verified', '2025-07-10 08:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'oksana.semenova@test.com'),     'other', 'Переводчик на международной конференции',   'Синхронный перевод с английского и французского',               2025, 'link',  'https://example.com/conf/intl',       'verified', '2025-05-15 14:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'larisa.medvedeva@test.com'),    'other', 'Преподаватель курсов иностранного языка',   'Ведёт бесплатные занятия английским для пенсионеров',           2024, 'none',  NULL,                                  'verified', '2024-10-01 11:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'nadezhda.grisha@test.com'),     'other', 'Победитель конкурса копирайтинга',          '1 место в конкурсе «Слово года» среди молодых авторов',         2025, 'link',  'https://example.com/copy/award',      'verified', '2025-02-28 12:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'sergey.timofeev@test.com'),     'other', 'Победитель конкурса биотехнологий',         'Проект по ускоренному компостированию вышел в финал',           2024, 'link',  'https://example.com/biotech/final',   'verified', '2024-12-10 13:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'grigory.vasilyev@test.com'),    'other', 'Участник молодёжного астро-лагеря',         'Наблюдение Персеид в Крымской обсерватории',                    2025, 'photo', '',                                   'verified', '2025-08-12 22:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'aleksandra.tarasova@test.com'), 'other', 'Руководитель школьного экоотряда',          'Собрала команду 25 человек, провела 10 эко-акций за год',       2025, 'none',  NULL,                                  'verified', '2025-03-01 10:00:00'),
(gen_random_uuid(), (SELECT id FROM public.profiles WHERE email = 'vadim.polyakov@test.com'),      'other', 'Репетитор математики для ВПР',              'Подготовил 12 школьников, все сдали на «4» и «5»',             2024, 'none',  NULL,                                  'verified', '2024-05-20 09:00:00')

ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- РЕАКЦИИ (crown/clown)
-- created_at сдвигается на 14-365 дней назад, чтобы тестовые
-- реакции не попадали в недельный бюджет текущей недели.
-- Распределение: ~65% crown, ~35% clown (короны чаще).
-- =====================================================
INSERT INTO public.reactions (id, achievement_id, user_id, kind, cost, created_at)
SELECT
  gen_random_uuid(),
  achievement_id,
  user_id,
  kind,
  CASE kind WHEN 'crown' THEN 1 ELSE 2 END AS cost,
  created_at
FROM (
  SELECT
    a.id AS achievement_id,
    p.id AS user_id,
    CASE WHEN random() < 0.65 THEN 'crown' ELSE 'clown' END AS kind,
    NOW() - INTERVAL '1 day' * (14 + floor(random() * 350)) AS created_at
  FROM public.achievements a CROSS JOIN public.profiles p
  WHERE random() < 0.04 AND a.user_id <> p.id
) sub
ON CONFLICT (achievement_id, user_id) DO NOTHING;

-- =====================================================
-- ДРУЗЬЯ
-- =====================================================
INSERT INTO public.friends (id, user_id, friend_id, status, created_at)
SELECT gen_random_uuid(), p1.id, p2.id, 'accepted', NOW() - INTERVAL '1 day' * floor(random() * 30)
FROM public.profiles p1 CROSS JOIN public.profiles p2
WHERE p1.id < p2.id AND random() < 0.033
LIMIT 40
ON CONFLICT (user_id, friend_id) DO NOTHING;

-- =====================================================
-- ЧЕЛЛЕНДЖИ
-- =====================================================
INSERT INTO public.challenges (id, title, description, category, goal_type, unit, proof_config, starts_at, ends_at, status, created_by, created_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'На велике — больше всех!', 'Кто проедет больше километров на велосипеде за неделю? Делись скриншотами из Strava!', 'sport', 'distance', 'км', '{"fields": ["photo", "value"], "valueLabel": "км", "valueRequired": true}'::jsonb, NOW() - INTERVAL '3 days', NOW() + INTERVAL '4 days', 'active', (SELECT id FROM public.profiles WHERE email = 'alexey.ivanov@test.com' LIMIT 1), NOW() - INTERVAL '5 days'),
  ('22222222-2222-2222-2222-222222222222', 'Кино-марафон', 'Посмотри как можно больше фильмов за неделю! Делись рецензиями.', 'movies', 'count', 'фильмов', '{"fields": ["text", "url"], "valueLabel": "фильмов", "valueRequired": false}'::jsonb, NOW() - INTERVAL '17 days', NOW() - INTERVAL '10 days', 'completed', (SELECT id FROM public.profiles WHERE email = 'alexey.ivanov@test.com' LIMIT 1), NOW() - INTERVAL '20 days'),
  ('33333333-3333-3333-3333-333333333333', 'Код каждый день', 'Сделай коммит в GitHub каждый день. Минимум — один.', 'it', 'boolean', null, '{"fields": ["url"], "valueLabel": "дней", "valueRequired": false}'::jsonb, NOW() - INTERVAL '24 days', NOW() - INTERVAL '17 days', 'completed', (SELECT id FROM public.profiles WHERE email = 'alexey.ivanov@test.com' LIMIT 1), NOW() - INTERVAL '27 days');

-- =====================================================
-- САБМИТЫ ЧЕЛЛЕНДЖЕЙ
-- =====================================================
INSERT INTO public.challenge_submissions (challenge_id, user_id, proof_type, proof_value, value, description, submitted_at)
SELECT
  '11111111-1111-1111-1111-111111111111',
  p.id,
  CASE WHEN random() < 0.5 THEN 'photo' ELSE 'text' END,
  CASE WHEN random() < 0.5 THEN 'https://example.com/strava-proof.jpg' ELSE 'Сегодня проехал ' || (floor(random() * 50) + 5)::text || ' км' END,
  floor(random() * 50) + 5,
  'Отличная погода для катания!',
  NOW() - INTERVAL '1 day' * floor(random() * 3)
FROM public.profiles p
ORDER BY random()
LIMIT 20;

INSERT INTO public.challenge_submissions (challenge_id, user_id, proof_type, proof_value, value, description, submitted_at)
SELECT
  '22222222-2222-2222-2222-222222222222',
  p.id,
  'text',
  'https://example.com/movie-review.jpg',
  1,
  'Сегодня посмотрел ' || (CASE WHEN random() < 0.25 THEN '«Интерстеллар»' WHEN random() < 0.5 THEN '«Начало»' WHEN random() < 0.75 THEN '«Дюнкерк»' ELSE '«Оппенгеймер»' END),
  NOW() - INTERVAL '14 days' - INTERVAL '1 day' * floor(random() * 5)
FROM public.profiles p
ORDER BY random()
LIMIT 35;

-- =====================================================
-- БЕЙДЖИ
-- =====================================================
INSERT INTO public.badges (user_id, type, label, challenge_id, awarded_at)
SELECT
  (SELECT user_id FROM public.challenge_submissions WHERE challenge_id = '22222222-2222-2222-2222-222222222222' GROUP BY user_id ORDER BY sum(coalesce(value, 1)) DESC LIMIT 1),
  'king_week',
  'Король недели: Кино-марафон',
  '22222222-2222-2222-2222-222222222222',
  NOW() - INTERVAL '9 days'
UNION ALL
SELECT
  (SELECT user_id FROM public.challenge_submissions WHERE challenge_id = '33333333-3333-3333-3333-333333333333' GROUP BY user_id ORDER BY sum(coalesce(value, 1)) DESC LIMIT 1),
  'king_week',
  'Король недели: Код каждый день',
  '33333333-3333-3333-3333-333333333333',
  NOW() - INTERVAL '16 days'
UNION ALL
SELECT
  (SELECT user_id FROM public.challenge_submissions WHERE challenge_id = '22222222-2222-2222-2222-222222222222' GROUP BY user_id ORDER BY sum(coalesce(value, 1)) ASC LIMIT 1),
  'clown_week',
  'Клоун недели: Кино-марафон',
  '22222222-2222-2222-2222-222222222222',
  NOW() - INTERVAL '9 days';

-- =====================================================
-- Возвращаем нормальный режим: триггеры снова стреляют.
-- =====================================================
SET session_replication_role = origin;