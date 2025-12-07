#!/bin/bash

# Task Management App – macOS Environment Bootstrap
# This script prepares the project for local development on macOS.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

echo "🚀 Task Management App - macOS Setup"
echo "Project root: $ROOT_DIR"

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo "🔍 Checking required tools..."
missing_tools=()
for tool in brew python3 node npm psql; do
    if ! command_exists "$tool"; then
        missing_tools+=("$tool")
    fi
done

if [ "${#missing_tools[@]}" -ne 0 ]; then
    echo "❗ Missing tools detected: ${missing_tools[*]}"
    echo "Please install the missing tools before continuing."
    echo "Recommended Homebrew installs:"
    echo "  brew install python@3.13 node postgresql"
    echo "Once installed, re-run this script."
    exit 1
fi

echo "✅ Required command-line tools are available."

echo "📦 Setting up backend virtual environment..."
cd "$BACKEND_DIR"

if [ ! -d "venv" ]; then
    echo "  ➜ Creating virtual environment..."
    python3 -m venv venv
else
    echo "  ✓ Existing virtual environment detected."
fi

source venv/bin/activate

echo "  ➜ Upgrading pip..."
pip install --upgrade pip

echo "  ➜ Installing backend dependencies..."
pip install -r requirements.txt

if [ ! -f ".env" ]; then
    echo "  ➜ Creating backend .env from template..."
    cp .env.example .env
    echo "    ⚠️  Update backend/.env with valid SECRET_KEY and DB credentials."
fi

echo "  ➜ Applying database migrations..."
python manage.py migrate

echo "  ➜ (Optional) Creating superuser..."
if ! python manage.py shell -c "from django.contrib.auth import get_user_model; exit(0) if get_user_model().objects.filter(is_superuser=True).exists() else exit(1)"; then
    echo "    You can create one later with: python manage.py createsuperuser"
fi

deactivate

echo "✅ Backend ready."

echo "📦 Setting up frontend..."
cd "$FRONTEND_DIR"

if [ ! -f ".env" ]; then
    echo "  ➜ Creating frontend .env from template..."
    cp .env.example .env
fi

echo "  ➜ Installing frontend dependencies..."
npm install

echo "✅ Frontend ready."

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the project:"
echo "1) Backend (port 8000):"
echo "   cd \"$BACKEND_DIR\""
echo "   source venv/bin/activate"
echo "   python manage.py runserver"
echo ""
echo "2) Frontend (port 3000):"
echo "   cd \"$FRONTEND_DIR\""
echo "   DANGEROUSLY_DISABLE_HOST_CHECK=true npm start"
echo ""
echo "Both services will open in your browser at:"
echo "  Frontend -> http://localhost:3000"
echo "  API      -> http://localhost:8000"
echo ""
echo "Happy coding! 🎯"


