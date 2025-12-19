# Task Management Application

Modern, full-stack task management application built with Django REST Framework (Backend) and React.js (Frontend).

## 🌿 Branches

- **`main`**: PostgreSQL version (recommended for Mac/Linux users)
- **`windows-sqlite`**: SQLite version (recommended for Windows users, no database setup required)

## 🚀 Features

- **User Authentication**: JWT-based authentication with registration and login
- **Task Management**: Create, read, update, and delete tasks
- **Task Categories**: Organize tasks by categories (Work, Personal, Shopping, etc.)
- **Priority Levels**: Set task priorities (Low, Medium, High, Urgent)
- **Due Dates**: Set and track task deadlines
- **Status Tracking**: Track task status (Pending, In Progress, Completed, Cancelled)
- **Advanced Filtering**: Filter tasks by status, priority, category, and search
- **Statistics Dashboard**: Visual analytics with Chart.js integration
- **Responsive Design**: Modern UI with Tailwind CSS
- **Real-time Updates**: Toast notifications for user actions

## 🛠️ Technology Stack

### Backend
- **Python 3.x** - Core programming language
- **Django 4.2.7** - Web framework
- **Django REST Framework 3.14.0** - API framework
- **Django REST Framework Simple JWT 5.3.0** - JWT authentication
- **SQLite 3** - Database (no setup required)
- **django-cors-headers 4.3.1** - CORS handling
- **django-filter 23.3** - API filtering

### Frontend
- **React 18.2.0** - UI library
- **React Router DOM 6.8.1** - Client-side routing
- **Axios 1.3.4** - HTTP client
- **Chart.js 4.2.1** - Data visualization
- **React Chart.js 2 5.2.0** - React Chart.js integration
- **Tailwind CSS 3.2.7** - CSS framework
- **React Hook Form 7.43.5** - Form handling
- **React Hot Toast 2.4.0** - Notifications
- **Lucide React 0.263.1** - Icons
- **date-fns 2.29.3** - Date utilities

## 📁 Project Structure

```
task-management-app/
├── backend/                    # Django backend
│   ├── taskmanager_project/   # Django project settings
│   ├── tasks_api/             # Task management API
│   ├── authentication/        # User authentication
│   ├── requirements.txt       # Python dependencies
│   └── .env.example          # Environment variables template
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API services
│   │   ├── context/          # React context
│   │   ├── hooks/            # Custom hooks
│   │   └── utils/            # Utility functions
│   ├── public/               # Static assets
│   ├── package.json          # Node.js dependencies
│   └── .env.example         # Environment variables template
└── README.md                 # This file
```

## 🚀 Getting Started

### Branch Selection

This project has two branches for different operating systems:

- **`main` branch**: Uses PostgreSQL (recommended for Mac/Linux users)
- **`windows-sqlite` branch**: Uses SQLite (recommended for Windows users, no database setup required)

**For Windows users:**
```bash
git clone https://github.com/Efilant/task-management-app.git
cd task-management-app
git checkout windows-sqlite
```

**For Mac/Linux users:**
```bash
git clone https://github.com/Efilant/task-management-app.git
cd task-management-app
# Already on main branch with PostgreSQL
```

### Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn

**Note:** 
- **Windows (windows-sqlite branch)**: SQLite is used, which requires no additional setup or installation.
- **Mac/Linux (main branch)**: PostgreSQL 12+ is required. See backend README for setup instructions.

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run migrations:**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```
   
   **Note:** SQLite database (`db.sqlite3`) will be automatically created in the backend directory.

5. **Set up environment variables (optional):**
   ```bash
   cp .env.example .env
   # Edit .env if needed (SQLite doesn't require database credentials)
   ```

6. **Create superuser:**
   ```bash
   python manage.py createsuperuser
   ```

7. **Start development server:**
   ```bash
   python manage.py runserver
   ```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env if needed (default should work)
   ```

4. **Start development server:**
   ```bash
   npm start
   ```

The frontend will be available at `http://localhost:3000`

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `POST /api/auth/refresh/` - Refresh JWT token

### Task Endpoints

- `GET /api/tasks/` - List all tasks (with filtering and pagination)
- `POST /api/tasks/` - Create new task
- `GET /api/tasks/{id}/` - Get task details
- `PATCH /api/tasks/{id}/` - Update task
- `DELETE /api/tasks/{id}/` - Delete task
- `PATCH /api/tasks/{id}/mark_completed/` - Mark task as completed
- `PATCH /api/tasks/{id}/mark_in_progress/` - Mark task as in progress
- `GET /api/tasks/stats/` - Get task statistics
- `GET /api/tasks/recent/` - Get recent tasks
- `GET /api/tasks/overdue/` - Get overdue tasks

### Query Parameters

- `status` - Filter by task status
- `priority` - Filter by task priority
- `category` - Filter by task category
- `search` - Search in title and description
- `ordering` - Sort by field (created_at, due_date, priority, title)

## 🎨 Features Overview

### Dashboard
- Task overview with statistics
- Quick task creation
- Advanced filtering and search
- Task status management
- Responsive grid layout

### Statistics
- Visual charts for task distribution
- Completion rate tracking
- Category and priority analysis
- Overdue task monitoring

### Task Management
- Rich task creation form
- Priority and category assignment
- Due date tracking
- Status workflow (Pending → In Progress → Completed)
- Task editing and deletion

## 🔧 Configuration

### Backend Configuration

Key settings in `backend/taskmanager_project/settings.py`:

- Database configuration (SQLite by default, PostgreSQL available for production)
- JWT token settings
- CORS settings
- Pagination settings

### Frontend Configuration

Key settings in `frontend/src/services/authService.js`:

- API base URL
- Request/response interceptors
- Error handling

## 🧪 Testing

### Backend Testing
```bash
cd backend
python manage.py test
```

### Frontend Testing
```bash
cd frontend
npm test
```

## 🚀 Deployment

### Backend Deployment

1. Set `DEBUG=False` in production
2. Configure production database (consider PostgreSQL for production)
3. Set up static file serving
4. Configure CORS for production domain
5. Use environment variables for sensitive data

**Note:** For production, it's recommended to use PostgreSQL instead of SQLite for better performance and concurrent access.

### Frontend Deployment

1. Build production bundle:
   ```bash
   npm run build
   ```
2. Serve static files
3. Configure API URL for production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please open an issue in the repository.

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
  - User authentication
  - Task CRUD operations
  - Statistics dashboard
  - Responsive design
