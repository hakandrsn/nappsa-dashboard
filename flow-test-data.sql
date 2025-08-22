-- Flow sistemi için test verisi
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- 1. Test Soruları
INSERT INTO public.flow_questions (id, slug, is_start_question, created_at) VALUES
(1, 'hangi_yemek_tarifi_istiyorsun', TRUE, NOW()),
(2, 'hangi_mutfağı_seviyorsun', FALSE, NOW()),
(3, 'acılı_mı_seviyorsun', FALSE, NOW()),
(4, 'vejetaryen_misin', FALSE, NOW());

-- 2. Test Soru Çevirileri
INSERT INTO public.flow_question_translations (question_id, language_code, text) VALUES
-- Soru 1: Hangi yemek tarifi istiyorsun?
(1, 'tr', 'Hangi yemek tarifi istiyorsun?'),
(1, 'en', 'What kind of recipe do you want?'),

-- Soru 2: Hangi mutfağı seviyorsun?
(2, 'tr', 'Hangi mutfağı seviyorsun?'),
(2, 'en', 'Which cuisine do you prefer?'),

-- Soru 3: Acılı mı seviyorsun?
(3, 'tr', 'Acılı mı seviyorsun?'),
(3, 'en', 'Do you like spicy food?'),

-- Soru 4: Vejetaryen misin?
(4, 'tr', 'Vejetaryen misin?'),
(4, 'en', 'Are you vegetarian?');

-- 3. Test Action'ları
INSERT INTO public.flow_actions (id, description, action_type, parameters, created_at) VALUES
(1, 'Rastgele yemek tarifi getir', 'FETCH_RANDOM_RECIPE', '{"table_name": "food_recipes"}', NOW()),
(2, 'Türk mutfağı tarifi getir', 'FETCH_CUISINE_RECIPE', '{"cuisine": "turkish"}', NOW()),
(3, 'Acılı yemek tarifi getir', 'FETCH_SPICY_RECIPE', '{"spice_level": "high"}', NOW()),
(4, 'Vejetaryen tarif getir', 'FETCH_VEGETARIAN_RECIPE', '{"diet": "vegetarian"}', NOW());

-- 4. Test Cevapları
INSERT INTO public.flow_answers (id, question_id, next_question_id, action_id, created_at) VALUES
-- Soru 1'den Soru 2'ye
(1, 1, 2, NULL, NOW()),
-- Soru 2'den Soru 3'e
(2, 2, 3, NULL, NOW()),
-- Soru 3'ten Action 3'e (acılı)
(3, 3, NULL, 3, NOW()),
-- Soru 4'ten Action 4'e (vejetaryen)
(4, 4, NULL, 4, NOW()),
-- Soru 1'den direkt Action 1'e (rastgele)
(5, 1, NULL, 1, NOW()),
-- Soru 2'den direkt Action 2'ye (Türk mutfağı)
(6, 2, NULL, 2, NOW());

-- 5. Test Cevap Çevirileri
INSERT INTO public.flow_answer_translations (answer_id, language_code, text) VALUES
-- Cevap 1: Soru 1'den Soru 2'ye
(1, 'tr', 'Yemek tarifi istiyorum'),
(1, 'en', 'I want a recipe'),

-- Cevap 2: Soru 2'den Soru 3'e
(2, 'tr', 'Türk mutfağı'),
(2, 'en', 'Turkish cuisine'),

-- Cevap 3: Soru 3'ten Action 3'e
(3, 'tr', 'Evet, acılı seviyorum'),
(3, 'en', 'Yes, I like spicy'),

-- Cevap 4: Soru 4'ten Action 4'e
(4, 'tr', 'Evet, vejetaryenim'),
(4, 'en', 'Yes, I am vegetarian'),

-- Cevap 5: Soru 1'den Action 1'e
(5, 'tr', 'Rastgele bir tarif'),
(5, 'en', 'Random recipe'),

-- Cevap 6: Soru 2'den Action 2'ye
(6, 'tr', 'Direkt Türk tarifi'),
(6, 'en', 'Direct Turkish recipe');

-- Sequence'ları güncelle
SELECT setval('flow_questions_id_seq', (SELECT MAX(id) FROM public.flow_questions));
SELECT setval('flow_actions_id_seq', (SELECT MAX(id) FROM public.flow_actions));
SELECT setval('flow_answers_id_seq', (SELECT MAX(id) FROM public.flow_answers));
