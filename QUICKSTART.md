# Quick Start Guide

## Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

## Quick Setup

### Option 1: Start Both Servers (Recommended)
После первоначальной настройки (см. Option 2), запустите оба сервера одной командой:

```bash
./start.sh
```

Или из корня проекта:
```bash
cd /Users/mikhail/Downloads/MHA/mental-health-app-broken
./start.sh
```

Этот скрипт запустит:
- Backend (Django) на `127.0.0.1:8000`
- Frontend (Vite) на порту `8080`

Для остановки нажмите `Ctrl+C`.

### Option 2: Automated Setup
```bash
./setup.sh
```

### Option 3: Manual Setup (Separate Terminals)

#### Backend Setup & Run
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py seed_data
python manage.py createsuperuser  # Optional
python manage.py runserver 127.0.0.1:8000
```

#### Frontend Setup & Run
```bash
cd frontend
npm install
npm run dev
```

## Access the Application

- Frontend: http://localhost:8080
- Backend API: http://localhost:8080/api (proxied through frontend)
- Admin Panel: http://localhost:8000/admin

## Default Test User

After creating a superuser, you can log in through the Django admin panel or implement a login page.

## Features to Try

1. **Voice Conversation**: Go to `/conversation` and click the microphone to start speaking
2. **CBT Library**: Browse content at `/cbt-library`
3. **Analytics**: View your progress at `/analytics`
4. **Crisis Support**: Access resources at `/crisis-support`

## Troubleshooting

### Speech Recognition Not Working
- Ensure you're using Chrome or Edge browser
- Check microphone permissions in browser settings
- Try typing instead of using voice input

### CORS Errors
- Ensure backend is running on port 8000
- Ensure frontend is running on port 8080
- Check CORS settings in `backend/config/settings.py`

### Database Issues
- Delete `db.sqlite3` and run migrations again
- Ensure you've run `python manage.py migrate`

