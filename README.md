# Mental Health App - Voice-First Therapeutic Platform

A comprehensive mental health web application built with React/TypeScript frontend and Django backend, implementing a voice-first therapeutic platform with CBT library, analytics, and crisis support.

## Features

### 🎤 Core Voice Interface
- Animated voice input system with circular waveform visualization
- Real-time amplitude-based vibrations and color changes
- Speech-to-text processing with emotional sentiment analysis
- Multi-modal input support (voice, text, quick mood selection)

### 💬 Therapeutic Conversation Flow
- Initial therapist greeting: "Привет, как ты?" with avatar animation
- Intelligent response system with empathetic, validating replies
- Progressive action buttons: "Talk More" / "Record Mental State"
- Continuous emotional state tracking throughout interactions

### 📚 CBT Library System
- Structured content library with categories:
  - CBT Foundations
  - Therapeutic Techniques
  - Condition-Specific Modules
  - Interactive Exercises
- Multi-format delivery: text content with voiceover narration
- Progress tracking and completion indicators

### 📊 Advanced Analytics Dashboard
- Emotional timeline with interactive charts
- Theme analysis with word cloud visualization
- Pattern recognition and correlation insights
- Progress metrics and engagement tracking

### 🆘 Crisis Support Protocol
- Real-time risk detection in user input
- Emergency resource access and safety planning
- Calm, non-alarming interface transitions
- Clear escalation procedures

## Tech Stack

### Backend
- Django 4.2.7
- Django REST Framework
- SQLite (development) / PostgreSQL (production)
- VADER Sentiment Analysis
- Channels for WebSocket support

### Frontend
- React 18.2
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion for animations
- Recharts for data visualization
- Zustand for state management
- React Query for server state
- React Hook Form for inputs
- Web Speech API for STT/TTS

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

5. Create a superuser:
```bash
python manage.py createsuperuser
```

6. Run the development server:
```bash
python manage.py runserver
```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Project Structure

```
mental-health-app/
├── backend/
│   ├── api/
│   │   ├── models.py          # Database models
│   │   ├── views.py            # API views
│   │   ├── serializers.py     # DRF serializers
│   │   ├── services.py         # Business logic (sentiment analysis, etc.)
│   │   └── urls.py             # API routes
│   ├── config/
│   │   ├── settings.py         # Django settings
│   │   └── urls.py             # Main URL configuration
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── pages/              # Page components
│   │   ├── services/           # API service layer
│   │   ├── store/              # Zustand store
│   │   └── types/              # TypeScript types
│   └── package.json
└── README.md
```

## API Endpoints

### Conversations
- `GET /api/sessions/` - List all sessions
- `POST /api/sessions/` - Create a new session
- `GET /api/sessions/active/` - Get active session
- `POST /api/sessions/{id}/end_session/` - End a session

### Voice Processing
- `POST /api/voice/process/` - Process voice input and get response

### Emotional States
- `GET /api/emotional-states/` - List emotional states
- `POST /api/emotional-states/` - Create emotional state
- `GET /api/emotional-states/timeline/` - Get emotional timeline

### CBT Library
- `GET /api/cbt-content/` - List CBT content
- `GET /api/cbt-progress/` - Get user progress
- `POST /api/cbt-progress/{id}/update_progress/` - Update progress

### Analytics
- `GET /api/analytics/dashboard/` - Get dashboard data

### Crisis Resources
- `GET /api/crisis-resources/` - List crisis resources

## Development Notes

### Voice Recognition
The app uses the Web Speech API for speech-to-text. Browser support:
- Chrome/Edge: Full support
- Safari: Limited support
- Firefox: Not supported

### Sentiment Analysis
The backend uses VADER Sentiment Analyzer for real-time sentiment analysis and risk detection.

### Authentication
Currently uses Django's session authentication. For production, consider implementing JWT tokens or OAuth2.

## Production Deployment

1. Set `DEBUG = False` in `settings.py`
2. Configure proper database (PostgreSQL recommended)
3. Set up environment variables for `SECRET_KEY`
4. Configure CORS for your domain
5. Set up static file serving
6. Use a production WSGI server (Gunicorn)
7. Set up reverse proxy (Nginx)

## License

This project is for educational purposes. Please ensure compliance with healthcare regulations (HIPAA, GDPR, etc.) before using in production.

## Disclaimer

This application is not a replacement for professional mental health care. Always seek help from licensed mental health professionals for serious concerns.

