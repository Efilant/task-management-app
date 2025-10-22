#!/bin/bash

# Task Management App - Quick Start Script
# Bu script VSCode'da projeyi hızlıca başlatmak için kullanılır

echo "🚀 Task Management App - Quick Start"
echo "======================================"

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Backend kurulumu
echo -e "${BLUE}📦 Backend kurulumu başlatılıyor...${NC}"
cd backend

# Virtual environment kontrolü
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}🔧 Virtual environment oluşturuluyor...${NC}"
    python3 -m venv venv
fi

# Virtual environment'ı aktifleştir
echo -e "${YELLOW}🔧 Virtual environment aktifleştiriliyor...${NC}"
source venv/bin/activate

# Dependencies yükle
echo -e "${YELLOW}📥 Dependencies yükleniyor...${NC}"
pip install -r requirements.txt

# Environment dosyası kontrolü
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}🔧 Environment dosyası oluşturuluyor...${NC}"
    cp .env.example .env
    echo -e "${RED}⚠️  Lütfen .env dosyasını düzenleyin!${NC}"
fi

# Migrations
echo -e "${YELLOW}🗄️  Migrations çalıştırılıyor...${NC}"
python manage.py makemigrations
python manage.py migrate

echo -e "${GREEN}✅ Backend hazır!${NC}"

# Frontend kurulumu
echo -e "${BLUE}📦 Frontend kurulumu başlatılıyor...${NC}"
cd ../frontend

# Dependencies yükle
echo -e "${YELLOW}📥 Dependencies yükleniyor...${NC}"
npm install

# Environment dosyası kontrolü
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}🔧 Environment dosyası oluşturuluyor...${NC}"
    cp .env.example .env
fi

echo -e "${GREEN}✅ Frontend hazır!${NC}"

echo ""
echo -e "${GREEN}🎉 Kurulum tamamlandı!${NC}"
echo ""
echo -e "${BLUE}📋 Sonraki adımlar:${NC}"
echo "1. Backend'i başlatmak için: cd backend && source venv/bin/activate && python manage.py runserver"
echo "2. Frontend'i başlatmak için: cd frontend && npm start"
echo "3. Tarayıcıda http://localhost:3000 adresini açın"
echo ""
echo -e "${YELLOW}💡 VSCode'da Tasks menüsünden de başlatabilirsiniz!${NC}"
