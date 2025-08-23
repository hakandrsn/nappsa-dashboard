-- Flow Actions tablosuna ek özellikler ekle
ALTER TABLE public.flow_actions 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'general',
ADD COLUMN IF NOT EXISTS icon VARCHAR(50),
ADD COLUMN IF NOT EXISTS color VARCHAR(20) DEFAULT 'blue';

-- Yeni sütunlar için açıklama ekle
COMMENT ON COLUMN public.flow_actions.is_active IS 'Action aktif mi?';
COMMENT ON COLUMN public.flow_actions.priority IS 'Action önceliği (düşük sayı = yüksek öncelik)';
COMMENT ON COLUMN public.flow_actions.category IS 'Action kategorisi (recipe, movie, chat, system vb.)';
COMMENT ON COLUMN public.flow_actions.icon IS 'Action için icon (lucide-react icon adı)';
COMMENT COLUMN public.flow_actions.color IS 'Action rengi (CSS color değeri)';

-- Mevcut action'ları güncelle
UPDATE public.flow_actions SET 
  category = 'recipe',
  icon = 'utensils',
  color = 'green'
WHERE action_type IN ('FETCH_RANDOM_RECIPE', 'FETCH_RECIPE_BY_CUISINE');

UPDATE public.flow_actions SET 
  category = 'movie',
  icon = 'film',
  color = 'blue'
WHERE action_type IN ('FETCH_MOVIE_BY_GENRE');

UPDATE public.flow_actions SET 
  category = 'chat',
  icon = 'message-circle',
  color = 'purple'
WHERE action_type IN ('FETCH_CHAT_TOPIC');

UPDATE public.flow_actions SET 
  category = 'system',
  icon = 'settings',
  color = 'gray'
WHERE action_type IN ('SHOW_CUSTOM_MESSAGE', 'REDIRECT_TO_URL', 'OPEN_MODAL', 'CALL_API_ENDPOINT');

-- Yeni action tipleri ekle
INSERT INTO public.flow_actions (description, action_type, parameters, category, icon, color) VALUES
('Kullanıcı profilini getir', 'FETCH_USER_PROFILE', '{"include_avatar": true}', 'category', 'user', 'indigo'),
('Hava durumu bilgisi getir', 'FETCH_WEATHER', '{"city": "Istanbul", "units": "metric"}', 'weather', 'cloud', 'sky'),
('Haber başlıkları getir', 'FETCH_NEWS', '{"category": "technology", "limit": 5}', 'news', 'newspaper', 'orange'),
('Müzik önerisi getir', 'FETCH_MUSIC_RECOMMENDATION', '{"genre": "pop", "mood": "happy"}', 'music', 'music', 'pink'),
('Egzersiz önerisi getir', 'FETCH_EXERCISE_SUGGESTION', '{"difficulty": "beginner", "duration": 30}', 'fitness', 'dumbbell', 'red');

-- Tabloyu kontrol et
SELECT 
  id,
  description,
  action_type,
  category,
  icon,
  color,
  is_active,
  priority,
  created_at
FROM public.flow_actions 
ORDER BY category, priority, created_at;
