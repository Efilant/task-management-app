# Backend Setup Instructions

## Prerequisites
- Python 3.8 or higher
- PostgreSQL 12 or higher
- pip (Python package manager)

## Installation Steps

### 1. Create Virtual Environment
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Database Setup
Create a PostgreSQL database:
```sql
CREATE DATABASE taskmanager_db;
CREATE USER postgres WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE taskmanager_db TO postgres;
```

### 4. Environment Configuration
```bash
cp .env.example .env
# Edit .env file with your database credentials
```

### 5. Run Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### 6. Create Superuser (Optional)
```bash
python manage.py createsuperuser
```

### 7. Start Development Server
```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Authentication
- POST `/api/auth/register/` - User registration
- POST `/api/auth/login/` - User login
- POST `/api/auth/logout/` - User logout
- POST `/api/auth/refresh/` - Refresh JWT token

### Tasks
- GET `/api/tasks/` - List tasks
- POST `/api/tasks/` - Create task
- GET `/api/tasks/{id}/` - Get task details
- PATCH `/api/tasks/{id}/` - Update task
- DELETE `/api/tasks/{id}/` - Delete task
- GET `/api/tasks/stats/` - Get statistics
