# 🧪 Test Dosyaları

Bu dizinde Task Management uygulaması için kapsamlı test dosyaları bulunmaktadır.

## 📁 Test Dosyaları

### 1. `api_tests.py` - API Endpoint Testleri
Tüm API endpoint'lerini otomatik olarak test eder.

**Test Edilen Özellikler:**
- ✅ Server bağlantısı
- ✅ Authentication endpoint'leri
- ✅ Kullanıcı kaydı ve girişi
- ✅ JWT token işlemleri
- ✅ Task CRUD operasyonları
- ✅ Filtreleme ve arama
- ✅ Yetkisiz erişim koruması
- ✅ Token yenileme
- ✅ Çıkış işlemi

**Çalıştırma:**
```bash
python api_tests.py
```

### 2. `security_tests.py` - Güvenlik Testleri
Güvenlik açıklarını ve authentication sistemini test eder.

**Test Edilen Güvenlik Özellikleri:**
- 🔒 Şifre güçlülüğü kontrolü
- 📧 Email format validasyonu
- 👤 Duplicate kayıt koruması
- 🛡️ Brute force koruması
- 🔑 JWT token güvenliği
- 💉 SQL injection koruması
- 🛡️ XSS koruması
- 🔄 CSRF koruması
- ⏱️ Rate limiting
- 📝 Input validasyonu
- 🔐 Session güvenliği
- 🛡️ Security headers

**Çalıştırma:**
```bash
python security_tests.py
```

## 🚀 Test Çalıştırma

### Önkoşullar
1. Backend server çalışıyor olmalı (`http://localhost:8000`)
2. Frontend server çalışıyor olmalı (`http://localhost:3000`)
3. Veritabanı bağlantısı aktif olmalı

### Hızlı Test
```bash
# API testlerini çalıştır
python api_tests.py

# Güvenlik testlerini çalıştır
python security_tests.py
```

### Detaylı Test
```bash
# Verbose output ile çalıştır
python api_tests.py --verbose
python security_tests.py --verbose
```

## 📊 Test Sonuçları

### API Testleri Sonuçları
- **Total Tests**: Toplam test sayısı
- **Passed**: Başarılı testler ✅
- **Failed**: Başarısız testler ❌
- **Success Rate**: Başarı oranı (%)

### Güvenlik Testleri Sonuçları
- **Security Score**: Güvenlik puanı (%)
- **Vulnerabilities**: Tespit edilen güvenlik açıkları
- **Recommendations**: Güvenlik önerileri

## 🔧 Test Konfigürasyonu

### Environment Variables
Test dosyaları aşağıdaki environment variable'ları kullanır:

```bash
# Backend URL (varsayılan: http://localhost:8000/api)
export API_BASE_URL=http://localhost:8000/api

# Test timeout (varsayılan: 30 saniye)
export TEST_TIMEOUT=30

# Verbose output (varsayılan: false)
export VERBOSE=false
```

### Test Verileri
- Test kullanıcıları otomatik olarak oluşturulur
- Test görevleri otomatik olarak temizlenir
- Test sonrası veritabanı temizliği yapılır

## 🐛 Hata Ayıklama

### Yaygın Hatalar

1. **Connection Error**
   ```
   ❌ Backend server'a bağlanılamıyor
   ```
   **Çözüm**: Backend server'ın çalıştığından emin olun

2. **Authentication Failed**
   ```
   ❌ Kullanıcı girişi başarısız
   ```
   **Çözüm**: Admin kullanıcısının mevcut olduğundan emin olun

3. **Database Error**
   ```
   ❌ Veritabanı bağlantı hatası
   ```
   **Çözüm**: PostgreSQL'in çalıştığından emin olun

### Debug Mode
Debug modunda çalıştırmak için:
```bash
python api_tests.py --debug
python security_tests.py --debug
```

## 📈 Test Raporları

Test sonuçları otomatik olarak raporlanır:
- Console output
- JSON format (opsiyonel)
- HTML report (opsiyonel)

## 🔄 CI/CD Integration

Bu testler CI/CD pipeline'ında kullanılabilir:

```yaml
# GitHub Actions örneği
- name: Run API Tests
  run: python api_tests.py

- name: Run Security Tests
  run: python security_tests.py
```

## 📝 Test Geliştirme

Yeni test eklemek için:

1. İlgili test dosyasını açın
2. Yeni test fonksiyonu ekleyin
3. `run_all_tests()` fonksiyonuna ekleyin
4. Test sonuçlarını loglayın

**Örnek Test Fonksiyonu:**
```python
def test_new_feature():
    """Yeni özelliği test et"""
    print("\n🆕 Testing new feature...")
    
    response = requests.get(f'{BASE_URL}/new-endpoint/')
    if response.status_code == 200:
        print("✅ New feature working correctly")
    else:
        print("❌ New feature failed")
```

## 🆘 Destek

Test dosyaları ile ilgili sorunlar için:
1. Console output'u kontrol edin
2. Backend loglarını inceleyin
3. Veritabanı bağlantısını test edin
4. Issue açın

---

**Not**: Bu testler development ortamı için tasarlanmıştır. Production ortamında çalıştırmadan önce güvenlik önlemlerini gözden geçirin.
