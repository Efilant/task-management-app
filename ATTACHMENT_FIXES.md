# Attachment Sistemi Sorunları ve Çözümleri

## 🔍 TESPİT EDİLEN SORUNLAR

### 1. **Backend: TaskSerializer'da Context Sorunu**
**Sorun:** `get_attachments` metodunda context geçiliyor ama bu context'in request içerdiğinden emin değiliz.

**Çözüm:** ViewSet'lerde context otomatik geçirilir, ama kontrol edelim.

### 2. **Frontend: Attachments Backend'den Gelmiyor**
**Sorun:** TaskCard'da attachments görünmüyor çünkü backend'den gelmiyor.

**Kontrol:** Console'da `task.attachments` değerini kontrol edin.

### 3. **Frontend: TaskModal'da Mevcut Dosyalar Yüklenmiyor**
**Sorun:** Görev güncellerken mevcut attachments gözükmüyor.

**Kontrol:** Console'da `Loading attachments for task: X` mesajını kontrol edin.

### 4. **Backend: Migration Kontrolü**
**Sorun:** Veritabanında attachments tablosu var mı?

**Kontrol:** `python manage.py showmigrations tasks_api` komutunu çalıştırın.

---

## ✅ YAPILMASI GEREKENLER (Sırayla)

### ADIM 1: Backend Migration Kontrolü
```bash
cd backend
source venv/bin/activate
python manage.py showmigrations tasks_api
```

Eğer `0002_taskattachment` migration'ı uygulanmamışsa:
```bash
python manage.py migrate tasks_api
```

### ADIM 2: Backend Sunucusunu Yeniden Başlatın
CORS ayarları değişti, sunucuyu yeniden başlatın:
```bash
# Eski process'i öldürün
lsof -ti:8000 | xargs kill -9

# Yeniden başlatın
cd backend
source venv/bin/activate
python manage.py runserver
```

### ADIM 3: Frontend Sunucusunu Yeniden Başlatın
```bash
# Eski process'i öldürün
lsof -ti:3000 | xargs kill -9

# Yeniden başlatın
cd frontend
npm start
```

### ADIM 4: Tarayıcı Konsolunu Kontrol Edin
1. Tarayıcıda F12'ye basın
2. Console sekmesine gidin
3. Bir görev oluşturun veya düzenleyin
4. Şu log'ları arayın:
   - `Sample task with attachments:`
   - `[TaskCard X] Checking attachments:`
   - `TaskModal - Task loaded:`
   - `Loading attachments for task:`

### ADIM 5: Backend API'yi Test Edin
Tarayıcıda veya Postman'de test edin:

**Attachments listesi için:**
```
GET http://localhost:8000/api/tasks/attachments/by_task/?task_id=1
Headers: Authorization: Bearer YOUR_TOKEN
```

**Task listesi için:**
```
GET http://localhost:8000/api/tasks/
Headers: Authorization: Bearer YOUR_TOKEN
```

Response'da `attachments` array'i var mı kontrol edin.

### ADIM 6: Dosya Yükleme Testi
1. Bir görev oluşturun
2. Görevi düzenleyin
3. Dosya seçin (PDF, PNG, JPG, DOCX, XLSX - max 10MB)
4. Console'da hata var mı kontrol edin
5. Network sekmesinde POST isteğini kontrol edin

---

## 🐛 YAYGIN HATALAR VE ÇÖZÜMLERİ

### Hata 1: "POST metoduna izin verilmiyor"
**Çözüm:** Backend sunucusunu yeniden başlatın (CORS ayarları değişti)

### Hata 2: "Bu göreve dosya ekleyemezsiniz"
**Çözüm:** 
- Task ID'nin doğru olduğundan emin olun
- Görevin size ait olduğundan emin olun
- Console'da task ID'yi kontrol edin

### Hata 3: Attachments gözükmüyor
**Kontrol Listesi:**
1. Backend'den attachments geliyor mu? (Network sekmesinde kontrol edin)
2. `task.attachments` array mi? (Console'da kontrol edin)
3. `task.attachments.length > 0` mu? (Console'da kontrol edin)

### Hata 4: "Dosya boyutu 10MB'dan büyük"
**Çözüm:** Daha küçük bir dosya seçin veya backend'deki `validate_file_size` fonksiyonunu kontrol edin

### Hata 5: "Bu dosya türü desteklenmiyor"
**Çözüm:** Sadece şu formatlar destekleniyor: PDF, PNG, JPG, DOCX, XLSX

---

## 🔧 MANUEL KONTROL ADIMLARI

### 1. Veritabanında Attachments Var mı?
```bash
cd backend
source venv/bin/activate
python manage.py shell
```

```python
from tasks_api.models import Task, TaskAttachment
from django.contrib.auth.models import User

# Tüm attachments'ları listele
print("All attachments:", TaskAttachment.objects.all())

# Bir task'ın attachments'larını listele
task = Task.objects.first()
if task:
    print(f"Task: {task.title}")
    print(f"Attachments: {task.attachments.all()}")
```

### 2. Backend API Response Kontrolü
Tarayıcıda:
1. F12 > Network sekmesi
2. Bir görev listesi isteği yapın
3. Response'u kontrol edin - `attachments` array'i var mı?

### 3. Frontend State Kontrolü
Console'da:
```javascript
// React DevTools ile veya console'da
// TaskCard render edilirken attachments kontrolü
```

---

## 📝 DEBUG KODLARI

Console'da şunları çalıştırın:

```javascript
// Tüm task'ları kontrol et
console.log('All tasks:', window.tasks || 'Not available');

// Bir task'ın attachments'ını kontrol et
const task = tasks[0]; // İlk task
console.log('Task attachments:', task?.attachments);
console.log('Is array:', Array.isArray(task?.attachments));
console.log('Length:', task?.attachments?.length);
```

---

## 🚀 HIZLI ÇÖZÜM (Tümünü Sıfırdan)

Eğer hiçbir şey çalışmıyorsa:

1. **Backend'i sıfırla:**
```bash
cd backend
source venv/bin/activate
python manage.py migrate tasks_api --fake-initial
python manage.py migrate
```

2. **Frontend'i temizle:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

3. **Tarayıcı cache'ini temizle:**
- Chrome: Ctrl+Shift+Delete
- Hard refresh: Ctrl+Shift+R

4. **Yeniden test et:**
- Yeni bir görev oluştur
- Dosya yükle
- Console'da hataları kontrol et
