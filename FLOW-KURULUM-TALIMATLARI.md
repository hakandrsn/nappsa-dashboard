# 🚀 Flow Sistemi Kurulum Talimatları

## 📋 Gereksinimler
- Supabase projesi kurulu
- SQL Editor erişimi

## 🔧 Adım Adım Kurulum

### 1. Veritabanı Tablolarını Oluştur
```sql
-- flow-tables-setup.sql dosyasını Supabase SQL Editor'da çalıştır
```

### 2. RPC Fonksiyonlarını Oluştur
```sql
-- flow-rpc-functions.sql dosyasını Supabase SQL Editor'da çalıştır
```

### 3. Test Verisini Ekle
```sql
-- flow-test-data.sql dosyasını Supabase SQL Editor'da çalıştır
```

## 🧪 Test Etme

### Dashboard'da Test
1. `/dashboard/flows` sayfasına git
2. "Test" sekmesine tıkla
3. "Başlangıç Sorusu Testi" butonuna tıkla
4. Sonuçları kontrol et

### Test Senaryoları
1. **Başlangıç Sorusu**: `get_flow_start_question('tr')`
2. **Belirli Soru**: `get_flow_question(2, 'tr')`
3. **Sonraki Adım**: `get_flow_next_step(1, 'tr')`

## 📊 Test Verisi Yapısı

### Flow Akışı
```
Soru 1 (Başlangıç) → Cevap 1 → Soru 2 → Cevap 2 → Soru 3 → Cevap 3 → Action 3
                ↓
            Cevap 5 → Action 1 (Rastgele tarif)
```

### Sorular
- **Soru 1**: "Hangi yemek tarifi istiyorsun?" (Başlangıç)
- **Soru 2**: "Hangi mutfağı seviyorsun?"
- **Soru 3**: "Acılı mı seviyorsun?"
- **Soru 4**: "Vejetaryen misin?"

### Actions
- **Action 1**: Rastgele yemek tarifi getir
- **Action 2**: Türk mutfağı tarifi getir
- **Action 3**: Acılı yemek tarifi getir
- **Action 4**: Vejetaryen tarif getir

## 🔍 Hata Ayıklama

### RPC Fonksiyon Bulunamadı Hatası
- `flow-rpc-functions.sql` dosyasının çalıştırıldığından emin ol
- Supabase SQL Editor'da fonksiyonların oluşturulduğunu kontrol et

### Tablo Bulunamadı Hatası
- `flow-tables-setup.sql` dosyasının çalıştırıldığından emin ol
- Tabloların `public` schema'da olduğunu kontrol et

### Test Verisi Hatası
- `flow-test-data.sql` dosyasının çalıştırıldığından emin ol
- Sequence'ların güncellendiğini kontrol et

## ✅ Başarılı Kurulum Kontrolü

1. **Tablolar**: `flow_questions`, `flow_actions`, `flow_answers` tabloları mevcut
2. **Fonksiyonlar**: `get_flow_start_question`, `get_flow_next_step`, `get_flow_question` mevcut
3. **Test Verisi**: En az 4 soru, 4 action, 6 cevap mevcut
4. **Dashboard**: Test sekmesinde hata almadan test çalışıyor

## 🎯 Sonraki Adımlar

1. **Gerçek Veri**: Test verisini gerçek verilerle değiştir
2. **Action Logic**: Action'ların gerçek işlevselliğini ekle
3. **Frontend Integration**: Expo uygulamasında flow sistemini kullan
4. **Analytics**: Flow kullanım istatistiklerini ekle
