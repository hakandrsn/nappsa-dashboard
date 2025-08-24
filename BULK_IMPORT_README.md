# 🚀 Toplu Tarif Ekleme Sistemi - Kullanım Kılavuzu

## 📋 Genel Bakış

Bu sistem, yüzlerce tarifi tek seferde veritabanına eklemenizi sağlar. 3 farklı format destekler:

1. **📝 Standart JSON Format** - Manuel yazılan tarifler
2. **🍽️ TheMealDB Format** - API'den gelen veriler
3. **🗄️ Direkt DB Format** - Bizim DB şemamıza uygun veriler

## ⚡ Performans Özellikleri

- **Batch İşleme**: 5'erli gruplar halinde paralel sorgular
- **Cache Sistemi**: Tekrar eden malzeme/kategori aramalarını önler
- **Paralel İşlem**: Malzeme, kategori ve mutfak ID'leri aynı anda aranır
- **Hızlandırılmış**: 100ms'den 50ms'ye düşürülen bekleme süreleri

## 🔧 Kullanım Adımları

### 1. Dashboard'a Git
```
/dashboard/foods → "Toplu Ekle" butonuna tıkla
```

### 2. Format Seç
- **Standart JSON**: Manuel yazılan tarifler için
- **TheMealDB**: API'den gelen veriler için
- **Direkt DB**: Bizim şemaya uygun veriler için

### 3. Veri Gir
Seçilen formata uygun JSON verisini yapıştır

### 4. Doğrula
"Veriyi Doğrula" butonuna tıkla

### 5. İşle
"Toplu Ekle" butonuna tıkla ve sonuçları bekle

## 📝 Format Örnekleri

### Standart JSON Format
```json
[
  {
    "title": "Somon Izgara",
    "description": "Taze somon balığı ızgara",
    "instructions": [
      "Somonu marine edin",
      "Izgarada pişirin"
    ],
    "ingredients": [
      { "name": "somon", "quantity": "500", "unit": "g" }
    ],
    "cuisine": "mediterranean",
    "categories": ["seafood", "grilled"]
  }
]
```

### TheMealDB Format
```json
{
  "meals": [
    {
      "strMeal": "Yaki Udon",
      "strCategory": "Vegetarian",
      "strArea": "Japanese",
      "strIngredient1": "Udon Noodles",
      "strMeasure1": "250g",
      "strInstructions": "Boil water..."
    }
  ]
}
```

### Direkt DB Format
```json
{
  "recipes": [
    {
      "image_url": "https://...",
      "prep_time_minutes": 15,
      "cook_time_minutes": 20
    }
  ],
  "ingredients": [
    { "source_id": "udon_noodles" }
  ],
  "recipe_ingredients": [
    { "recipe_id": 1, "ingredient_id": 1, "quantity": "250", "unit": "g" }
  ]
}
```

## 🎯 Özellikler

### Otomatik Dönüşüm
- TheMealDB formatı otomatik olarak bizim formatımıza çevrilir
- Malzeme miktarları otomatik parse edilir (örn: "250g" → quantity: "250", unit: "g")
- Instructions otomatik satırlara bölünür

### Akıllı Eşleştirme
- Malzeme adları ile mevcut malzemeler otomatik eşleştirilir
- Kategori ve mutfak isimleri otomatik bulunur
- Bulunamayan veriler için uyarı verilir

### Çoklu Dil Desteği
- Ana dil seçimi yapılır
- Translations objesi ile ek diller eklenebilir
- Desteklenen diller: tr, en, de, fr, es

## ⚠️ Dikkat Edilecekler

### Zorunlu Alanlar
- `title` - Tarif başlığı
- `instructions` - Pişirme talimatları (array)
- `ingredients` - Malzeme listesi

### Opsiyonel Alanlar
- `description` - Tarif açıklaması
- `image_url` - Resim URL'i
- `cuisine` - Mutfak türü (slug)
- `categories` - Kategori listesi (slug array)
- `difficulty` - Zorluk seviyesi (Easy/Medium/Hard)

### Performans İpuçları
- Cache'i düzenli temizleyin
- Büyük veri setlerinde batch boyutunu ayarlayın
- Duplicate detection'ı aktif tutun

## 🔍 Hata Ayıklama

### Yaygın Hatalar
1. **JSON Parse Hatası**: JSON formatını kontrol edin
2. **Malzeme Bulunamadı**: Malzeme adlarını kontrol edin
3. **Kategori Bulunamadı**: Kategori slug'larını kontrol edin
4. **Duplicate Tarif**: Mevcut tariflerle çakışma

### Çözümler
- Cache'i temizleyin
- Veri formatını kontrol edin
- Malzeme/kategori isimlerini standardize edin
- Duplicate detection sonuçlarını inceleyin

## 📊 Performans Metrikleri

- **Batch Boyutu**: 5 sorgu/paralel
- **Cache Hit Rate**: %80+ (tekrar eden veriler için)
- **İşlem Hızı**: ~50ms/tarif
- **Maksimum Veri**: 1000+ tarif tek seferde

## 🚀 Gelecek Geliştirmeler

- [ ] Excel/CSV import desteği
- [ ] Drag & Drop dosya yükleme
- [ ] Real-time progress bar
- [ ] Otomatik backup sistemi
- [ ] Batch işlem öncelikleri
- [ ] Hata recovery sistemi

---

**💡 İpucu**: Büyük veri setleri için önce küçük bir test yapın ve sonuçları kontrol edin!
