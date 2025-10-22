# VSCode'da Task Management Projesini Çalıştırma Rehberi

## 🚀 VSCode Kurulum ve Çalıştırma Adımları

### 1. VSCode'da Projeyi Açma

1. **VSCode'u açın**
2. **File > Open Folder** menüsünden `task-management-app` klasörünü seçin
3. Veya terminal'de:
   ```bash
   cd /Users/elifaltun/task-management-app
   code .
   ```

### 2. VSCode Eklentileri (Önerilen)

VSCode'da aşağıdaki eklentileri yükleyin:

**Backend için:**
- Python (Microsoft)
- Django
- Python Docstring Generator
- Python Indent

**Frontend için:**
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- Auto Rename Tag
- Bracket Pair Colorizer

**Genel:**
- GitLens
- Prettier - Code formatter
- ESLint

### 3. Backend Çalıştırma (Django)

#### Terminal 1 - Backend için:

1. **VSCode'da Terminal açın** (`Ctrl+`` veya `View > Terminal`)

2. **Backend dizinine gidin:**
   ```bash
   cd backend
   ```

3. **Virtual environment oluşturun:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

4. **Dependencies yükleyin:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Environment dosyasını oluşturun:**
   ```bash
   cp .env.example .env
   ```

6. **PostgreSQL veritabanını hazırlayın:**
   ```sql
   -- PostgreSQL'de çalıştırın:
   CREATE DATABASE taskmanager_db;
   CREATE USER postgres WITH PASSWORD 'password';
   GRANT ALL PRIVILEGES ON DATABASE taskmanager_db TO postgres;
   ```

7. **Migrations çalıştırın:**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

8. **Superuser oluşturun (opsiyonel):**
   ```bash
   python manage.py createsuperuser
   ```

9. **Sunucuyu başlatın:**
   ```bash
   python manage.py runserver
   ```

✅ **Backend hazır!** `http://localhost:8000` adresinde çalışıyor.

### 4. Frontend Çalıştırma (React)

#### Terminal 2 - Frontend için:

1. **Yeni terminal açın** (`Ctrl+Shift+`` veya `Terminal > New Terminal`)

2. **Frontend dizinine gidin:**
   ```bash
   cd frontend
   ```

3. **Dependencies yükleyin:**
   ```bash
   npm install
   ```

4. **Environment dosyasını oluşturun:**
   ```bash
   cp .env.example .env
   ```

5. **Development server'ı başlatın:**
   ```bash
   npm start
   ```

✅ **Frontend hazır!** `http://localhost:3000` adresinde çalışıyor.

### 5. VSCode Debugging Konfigürasyonu

#### Backend Debugging için `.vscode/launch.json`:

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Django Debug",
            "type": "python",
            "request": "launch",
            "program": "${workspaceFolder}/backend/manage.py",
            "args": ["runserver"],
            "django": true,
            "cwd": "${workspaceFolder}/backend",
            "env": {
                "DJANGO_SETTINGS_MODULE": "taskmanager_project.settings"
            }
        }
    ]
}
```

#### Frontend Debugging için `.vscode/launch.json`:

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "React Debug",
            "type": "node",
            "request": "launch",
            "program": "${workspaceFolder}/frontend/node_modules/.bin/react-scripts",
            "args": ["start"],
            "cwd": "${workspaceFolder}/frontend",
            "env": {
                "BROWSER": "none"
            }
        }
    ]
}
```

### 6. VSCode Workspace Ayarları

#### `.vscode/settings.json`:

```json
{
    "python.defaultInterpreterPath": "./backend/venv/bin/python",
    "python.terminal.activateEnvironment": true,
    "emmet.includeLanguages": {
        "javascript": "javascriptreact"
    },
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
        "source.fixAll.eslint": true
    },
    "files.exclude": {
        "**/__pycache__": true,
        "**/node_modules": true,
        "**/.git": true
    }
}
```

### 7. Hızlı Başlatma Scriptleri

#### `package.json` scripts (frontend için):

```json
{
    "scripts": {
        "start": "react-scripts start",
        "build": "react-scripts build",
        "test": "react-scripts test",
        "eject": "react-scripts eject",
        "dev": "react-scripts start"
    }
}
```

#### Backend için `manage.py` script:

```python
#!/usr/bin/env python
import os
import sys

if __name__ == '__main__':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'taskmanager_project.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)
```

### 8. VSCode Terminal Konfigürasyonu

#### `.vscode/tasks.json`:

```json
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "Start Backend",
            "type": "shell",
            "command": "python",
            "args": ["manage.py", "runserver"],
            "options": {
                "cwd": "${workspaceFolder}/backend"
            },
            "group": "build",
            "presentation": {
                "echo": true,
                "reveal": "always",
                "focus": false,
                "panel": "new"
            }
        },
        {
            "label": "Start Frontend",
            "type": "shell",
            "command": "npm",
            "args": ["start"],
            "options": {
                "cwd": "${workspaceFolder}/frontend"
            },
            "group": "build",
            "presentation": {
                "echo": true,
                "reveal": "always",
                "focus": false,
                "panel": "new"
            }
        }
    ]
}
```

### 9. Çalıştırma Sırası

1. **İlk önce Backend'i başlatın** (Terminal 1)
2. **Sonra Frontend'i başlatın** (Terminal 2)
3. **Tarayıcıda** `http://localhost:3000` adresini açın

### 10. Sorun Giderme

**Backend sorunları:**
- Virtual environment aktif mi kontrol edin
- PostgreSQL çalışıyor mu kontrol edin
- Port 8000 kullanımda mı kontrol edin

**Frontend sorunları:**
- Node.js versiyonu 16+ mı kontrol edin
- Port 3000 kullanımda mı kontrol edin
- `npm install` tamamlandı mı kontrol edin

**Genel sorunlar:**
- CORS hatası: Backend'de CORS ayarlarını kontrol edin
- API bağlantı hatası: Backend çalışıyor mu kontrol edin

### 11. VSCode Shortcuts

- `Ctrl+`` : Terminal aç/kapat
- `Ctrl+Shift+`` : Yeni terminal
- `F5` : Debug başlat
- `Ctrl+Shift+P` : Command palette
- `Ctrl+P` : Dosya arama

Bu rehberi takip ederek VSCode'da projeyi sorunsuz çalıştırabilirsiniz! 🚀
