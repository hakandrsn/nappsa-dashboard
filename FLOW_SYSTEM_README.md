# Flow Sistemi - Dinamik Kullanıcı Akış Motoru

Bu proje, kullanıcıya adım adım sorular sorarak kişiselleştirilmiş sonuçlara ulaştıran bir karar ağacı sistemi içerir.

## 🚀 Özellikler

- **Flow Yönetimi**: Yeni flow'lar oluşturma, düzenleme, silme
- **Soru Sistemi**: Her flow için sorular ekleme ve yönetme
- **Cevap Seçenekleri**: Her soru için cevap seçenekleri tanımlama
- **Action Sistemi**: Cevap seçimlerine göre tetiklenen eylemler
- **Çoklu Dil Desteği**: Türkçe, İngilizce ve diğer diller
- **Flow Builder**: Görsel flow oluşturucu arayüz
- **Real-time Preview**: Flow'ları test etme

## 🏗️ Mimari

### Veritabanı Yapısı

```
flows (Ana flow tablosu)
├── flow_questions (Sorular)
│   └── flow_question_translations (Soru çevirileri)
├── flow_answers (Cevap seçenekleri)
│   └── flow_answer_translations (Cevap çevirileri)
└── flow_actions (Eylemler)
```

### Action Tipleri

- `FETCH_RANDOM_RECIPE`: Rastgele yemek tarifi getir
- `FETCH_RECIPE_BY_CUISINE`: Mutfağa göre tarif getir
- `FETCH_MOVIE_BY_GENRE`: Türe göre film getir
- `SHOW_CUSTOM_MESSAGE`: Özel mesaj göster
- `REDIRECT_TO_URL`: URL'e yönlendir
- `CALL_API_ENDPOINT`: API çağrısı yap

## 🛠️ Kurulum

### 1. Veritabanı Kurulumu

Supabase SQL Editor'da `flow-database-setup.sql` dosyasını çalıştırın:

```sql
-- Supabase SQL Editor'da çalıştırın
\i flow-database-setup.sql
```

### 2. Frontend Kurulumu

```bash
# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın
npm run dev
```

### 3. Supabase Edge Functions

Aşağıdaki 3 Edge Function'ı oluşturun:

#### `get_flow_start_question`
Başlangıç sorusunu getirir.

#### `get_next_question_data`
Sonraki soru veya action'ı getirir.

#### `execute_action`
Action'ı çalıştırır ve sonucu döndürür.

## 📱 Kullanım

### Dashboard'da Flow Oluşturma

1. **Flow Ekle**: `/dashboard/flows` sayfasından yeni flow oluşturun
2. **Soru Ekle**: Flow builder'da sorular ekleyin
3. **Cevap Tanımla**: Her soru için cevap seçenekleri ekleyin
4. **Action Bağla**: Cevapları action'lara veya sonraki sorulara bağlayın
5. **Test Et**: Flow'u preview modunda test edin

### Frontend'de Flow Çalıştırma

```typescript
// Başlangıç sorusunu getir
const startQuestion = await supabase.rpc('get_flow_start_question', {
  p_flow_id: 1,
  p_language_code: 'tr'
})

// Cevap seçimine göre ilerle
const nextStep = await supabase.rpc('get_next_question_data', {
  p_question_id: 1,
  p_answer_id: 2,
  p_language_code: 'tr'
})

// Action'ı çalıştır
const result = await supabase.rpc('execute_action', {
  p_action_id: 1,
  p_context: { user_id: 123 }
})
```

## 🔧 Geliştirme

### Yeni Action Type Ekleme

1. `src/api/types.ts`'de `ACTION_TYPES`'a ekleyin
2. `ActionParameters` interface'ine parametreleri ekleyin
3. Supabase'de `execute_action` function'ında case ekleyin

### Yeni Flow Oluşturma

1. Dashboard'da flow oluşturun
2. Sorular ekleyin
3. Cevap seçenekleri tanımlayın
4. Action'ları bağlayın
5. Test edin

## 📊 Örnek Flow

**Yemek Tarifi Sihirbazı:**

```
Soru 1: "Hangi mutfak türünü tercih edersiniz?"
├── Cevap: "Türk Mutfağı" → Action: FETCH_RECIPE_BY_CUISINE
├── Cevap: "İtalyan Mutfağı" → Action: FETCH_RECIPE_BY_CUISINE
└── Cevap: "Sürpriz olsun" → Action: FETCH_RANDOM_RECIPE
```

## 🚨 Dikkat Edilecekler

- Her cevap için ya `next_question_id` ya da `action_id` dolu olmalı
- Flow'da döngü olmamalı
- Her flow'un sadece bir başlangıç sorusu olmalı
- Çeviriler tüm desteklenen diller için eklenmeli

## 🔮 Gelecek Özellikler

- [ ] Drag & Drop Flow Builder
- [ ] Flow Templates
- [ ] Analytics ve Raporlama
- [ ] A/B Testing
- [ ] Conditional Logic
- [ ] Webhook Integration

## 📞 Destek

Herhangi bir sorun yaşarsanız veya öneriniz varsa issue açın.
