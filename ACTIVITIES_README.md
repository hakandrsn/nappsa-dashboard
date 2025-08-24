# Activities Sistemi

Bu döküman, Nappsa Dashboard'da yeni eklenen Activities (Aktiviteler) sisteminin nasıl kullanılacağını açıklar.

## Genel Bakış

Activities sistemi, kullanıcılara önerilecek aktiviteleri yönetmek için tasarlanmıştır. Sistem, hiyerarşik kategori yapısı ile aktiviteleri organize eder ve çoklu dil desteği sağlar.

## Veritabanı Yapısı

### Ana Tablolar

1. **activity_categories** - Aktivite kategorileri (hiyerarşik yapı)
2. **activities** - Aktiviteler
3. **activity_translations** - Aktivite çevirileri
4. **activity_category_translations** - Kategori çevirileri
5. **activity_category_links** - Aktivite-kategori bağlantıları

### İlişkiler

- Bir aktivite birden fazla kategoriye ait olabilir
- Kategoriler hiyerarşik olarak organize edilebilir (ana kategori + alt kategoriler)
- Her aktivite ve kategori için Türkçe ve İngilizce çeviriler desteklenir

## Özellikler

### 1. Kategori Yönetimi

- **Ana Kategoriler**: Üst seviye kategoriler (örn: "Evde", "Dışarıda")
- **Alt Kategoriler**: Ana kategorilere bağlı alt kategoriler (örn: "Evde Romantik", "Evde Eğlenceli")
- **Hiyerarşik Yapı**: Sınırsız derinlikte kategori ağacı oluşturulabilir

### 2. Aktivite Yönetimi

- **Çoklu Dil Desteği**: Her aktivite için Türkçe ve İngilizce başlık/açıklama
- **Kategori Bağlantıları**: Bir aktivite birden fazla kategoriye atanabilir
- **Detaylı Açıklamalar**: Her aktivite için açıklayıcı metinler

### 3. Filtreleme ve Arama

- **Metin Arama**: Aktivite başlık ve açıklamalarında arama
- **Kategori Filtreleme**: Belirli kategorilere göre aktivite filtreleme
- **Hiyerarşik Filtreleme**: Ana kategori ve alt kategori bazında filtreleme

## Kullanım

### 1. Kategori Ekleme

1. "Aktiviteler" sayfasına gidin
2. "Kategoriler" tabına tıklayın
3. "Yeni Kategori" butonuna tıklayın
4. Slug, üst kategori ve çevirileri girin
5. "Oluştur" butonuna tıklayın

### 2. Aktivite Ekleme

1. "Aktiviteler" tabına gidin
2. "Yeni Aktivite" butonuna tıklayın
3. Türkçe ve İngilizce başlık/açıklama girin
4. Kategorileri seçin
5. "Oluştur" butonuna tıklayın

### 3. Düzenleme ve Silme

- Her aktivite ve kategori için düzenleme ve silme butonları mevcuttur
- Düzenleme modal'ında tüm bilgiler güncellenebilir
- Silme işlemi onay gerektirir

## Teknik Detaylar

### Frontend Bileşenleri

- **ActivitiesPage**: Ana sayfa bileşeni
- **ActivityFormModal**: Aktivite ekleme/düzenleme modal'ı
- **CategoryFormModal**: Kategori ekleme/düzenleme modal'ı
- **ActivitiesContext**: State yönetimi
- **useActivitiesApi**: API işlemleri

### API Endpoints

- `GET /activities` - Aktiviteleri listele
- `POST /activities` - Yeni aktivite oluştur
- `PUT /activities/:id` - Aktivite güncelle
- `DELETE /activities/:id` - Aktivite sil
- `GET /activity_categories` - Kategorileri listele
- `POST /activity_categories` - Yeni kategori oluştur
- `PUT /activity_categories/:id` - Kategori güncelle
- `DELETE /activity_categories/:id` - Kategori sil

## Test Verisi

Sistem test edilmek için `activities-test-data.sql` dosyasında örnek veriler bulunmaktadır. Bu dosyayı Supabase'de çalıştırarak test verilerini ekleyebilirsiniz.

## Gelecek Geliştirmeler

- Aktivite resimleri ekleme
- Aktivite zorluk seviyesi
- Aktivite süresi
- Aktivite maliyeti
- Kullanıcı favorileri
- Aktivite değerlendirmeleri
- Aktivite önerileri (AI tabanlı)

## Notlar

- Sistem tamamen çoklu dil desteği ile tasarlanmıştır
- Hiyerarşik kategori yapısı esnek ve genişletilebilir
- Tüm CRUD işlemleri desteklenir
- Responsive tasarım ile mobil uyumlu
- Mevcut proje mimarisine uygun olarak geliştirilmiştir
