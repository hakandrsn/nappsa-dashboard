-- Flow Actions için test verileri
INSERT INTO public.flow_actions (description, action_type, parameters) VALUES
('Rastgele yemek tarifi getir', 'FETCH_RANDOM_RECIPE', '{"table_name": "food_recipes"}'),
('Türk mutfağı tarifleri getir', 'FETCH_RECIPE_BY_CUISINE', '{"cuisine_slug": "turkish"}'),
('Aksiyon filmleri getir', 'FETCH_MOVIE_BY_GENRE', '{"genre_slug": "action"}'),
('Sohbet konusu öner', 'FETCH_CHAT_TOPIC', '{}'),
('Hoş geldin mesajı göster', 'SHOW_CUSTOM_MESSAGE', '{"message": "Hoş geldiniz! Size nasıl yardımcı olabilirim?"}'),
('Tarif sayfasına yönlendir', 'REDIRECT_TO_URL', '{"url": "/recipes"}'),
('Bilgi modalı aç', 'OPEN_MODAL', '{"modal_content": "Bu bir bilgi modalıdır."}'),
('API endpoint çağır', 'CALL_API_ENDPOINT', '{"api_endpoint": "/api/random-content"}');

-- Mevcut action'ları kontrol et
SELECT * FROM public.flow_actions;
