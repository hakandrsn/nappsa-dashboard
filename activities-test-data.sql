-- =================================================================
-- ACTIVITIES SİSTEMİ TEST VERİLERİ
-- =================================================================

-- Test kategorileri ekle
INSERT INTO public.activity_categories (id, parent_id, slug, created_at) VALUES
(1, NULL, 'evde', NOW()),
(2, NULL, 'disarida', NOW()),
(3, 1, 'evde_romantik', NOW()),
(4, 1, 'evde_eglenceli', NOW()),
(5, 2, 'disarida_romantik', NOW()),
(6, 2, 'disarida_eglenceli', NOW());

-- Test kategori çevirileri ekle
INSERT INTO public.activity_category_translations (id, category_id, language_code, name) VALUES
(1, 1, 'tr', 'Evde'),
(2, 1, 'en', 'At Home'),
(3, 2, 'tr', 'Dışarıda'),
(4, 2, 'en', 'Outside'),
(5, 3, 'tr', 'Evde Romantik'),
(6, 3, 'en', 'Romantic at Home'),
(7, 4, 'tr', 'Evde Eğlenceli'),
(8, 4, 'en', 'Fun at Home'),
(9, 5, 'tr', 'Dışarıda Romantik'),
(10, 5, 'en', 'Romantic Outside'),
(11, 6, 'tr', 'Dışarıda Eğlenceli'),
(12, 6, 'en', 'Fun Outside');

-- Test aktiviteleri ekle
INSERT INTO public.activities (id, created_at) VALUES
(1, NOW()),
(2, NOW()),
(3, NOW()),
(4, NOW()),
(5, NOW());

-- Test aktivite çevirileri ekle
INSERT INTO public.activity_translations (id, activity_id, language_code, title, description) VALUES
(1, 1, 'tr', 'Mum Işığında Akşam Yemeği', 'Sadece ikinize özel, mum ışığında romantik bir akşam yemeği hazırlayın.'),
(2, 1, 'en', 'Candlelit Dinner', 'Prepare a romantic candlelit dinner just for the two of you.'),
(3, 2, 'tr', 'Film Maratonu', 'Birlikte sevdiğiniz filmleri izleyin ve sıcak çikolata için.'),
(4, 2, 'en', 'Movie Marathon', 'Watch your favorite movies together and enjoy hot chocolate.'),
(5, 3, 'tr', 'Dans Etmek', 'Evde müzik açın ve birlikte dans edin.'),
(6, 3, 'en', 'Dancing', 'Turn on music at home and dance together.'),
(7, 4, 'tr', 'Park Gezisi', 'Güzel bir parkta yürüyüş yapın ve piknik yapın.'),
(8, 4, 'en', 'Park Walk', 'Take a walk in a beautiful park and have a picnic.'),
(9, 5, 'tr', 'Restoran Ziyareti', 'Romantik bir restoranda akşam yemeği yiyin.'),
(10, 5, 'en', 'Restaurant Visit', 'Have dinner at a romantic restaurant.');

-- Test aktivite-kategori bağlantıları ekle
INSERT INTO public.activity_category_links (activity_id, category_id) VALUES
(1, 3), -- Mum Işığında Akşam Yemeği -> Evde Romantik
(1, 1), -- Mum Işığında Akşam Yemeği -> Evde
(2, 4), -- Film Maratonu -> Evde Eğlenceli
(2, 1), -- Film Maratonu -> Evde
(3, 4), -- Dans Etmek -> Evde Eğlenceli
(3, 1), -- Dans Etmek -> Evde
(4, 6), -- Park Gezisi -> Dışarıda Eğlenceli
(4, 2), -- Park Gezisi -> Dışarıda
(5, 5), -- Restoran Ziyareti -> Dışarıda Romantik
(5, 2); -- Restoran Ziyareti -> Dışarıda

-- Sequence'leri güncelle
SELECT setval('activity_categories_id_seq', (SELECT MAX(id) FROM activity_categories));
SELECT setval('activity_category_translations_id_seq', (SELECT MAX(id) FROM activity_category_translations));
SELECT setval('activities_id_seq', (SELECT MAX(id) FROM activities));
SELECT setval('activity_translations_id_seq', (SELECT MAX(id) FROM activity_translations));
