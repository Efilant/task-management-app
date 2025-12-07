# Dosya Yükleme Sistemi Açıklaması

## 📁 Dosyalar Nasıl Yükleniyor?

### 1. **Frontend'den Dosya Seçimi**
- Kullanıcı bilgisayarından bir dosya seçer (PDF, PNG, JPG, DOCX, XLSX)
- Bu dosya **geçici olarak** tarayıcının belleğinde tutulur
- FormData ile backend'e gönderilir

### 2. **Backend'de İşleme**
- Backend dosyayı alır
- Dosya **`media/attachments/task_X/`** klasörüne kaydedilir
- Dosya bilgileri **veritabanına** kaydedilir:
  - Original filename (orijinal dosya adı)
  - File size (dosya boyutu)
  - Storage path (dosya yolu)
  - Upload date (yükleme tarihi)
  - Uploader user ID (yükleyen kullanıcı)

### 3. **Veritabanında Saklama**
- `TaskAttachment` modeli kullanılır
- Her attachment bir `Task` ile ilişkilendirilir
- Dosya fiziksel olarak `media/` klasöründe saklanır
- Veritabanında sadece **metadata** (dosya bilgileri) saklanır

## ✅ Yani:
- **EVET**, dosyalar veritabanına yükleniyor (metadata olarak)
- **EVET**, dosyalar fiziksel olarak sunucuda saklanıyor
- **HAYIR**, dosyalar veritabanının içine binary olarak kaydedilmiyor (bu kötü bir pratik)
- **EVET**, local dosya yükleme normal bir şey - her web uygulaması böyle çalışır

## 🔧 Şu Anki Sorun

**405 Method Not Allowed** hatası alıyorsunuz. Bu, backend'in POST metodunu kabul etmediği anlamına geliyor.

### Çözüm:
1. Backend sunucusunu **mutlaka yeniden başlatın**
2. Router kayıt sırası düzeltildi (attachments önce kaydediliyor)
3. Backend'de POST metodu destekleniyor (ModelViewSet otomatik destekler)

## 🚀 Yapmanız Gerekenler

```bash
# 1. Backend sunucusunu durdurun (Ctrl+C)
# 2. Yeniden başlatın:
cd /Users/elifaltun/task-management-app/backend
source venv/bin/activate
python manage.py runserver

# 3. Frontend'de tarayıcıyı yenileyin (Ctrl+Shift+R)
```

## 📝 Notlar

- Dosyalar `backend/media/attachments/task_X/` klasöründe saklanır
- Her dosya için veritabanında bir `TaskAttachment` kaydı oluşturulur
- Dosya silindiğinde hem fiziksel dosya hem de veritabanı kaydı silinir
- Görev silindiğinde tüm attachments otomatik silinir (CASCADE)
