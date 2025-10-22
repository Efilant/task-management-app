# Frontend Setup Instructions

## Prerequisites
- Node.js 16 or higher
- npm or yarn package manager

## Installation Steps

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env
# Edit .env file if needed (default should work)
```

### 3. Start Development Server
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

## Features

- User authentication (Login/Register)
- Task management (CRUD operations)
- Task filtering and search
- Statistics dashboard with charts
- Responsive design with Tailwind CSS
- Real-time notifications

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── services/      # API service functions
├── context/       # React context providers
├── hooks/         # Custom React hooks
└── utils/         # Utility functions
```
