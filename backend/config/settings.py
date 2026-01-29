"""
Django settings for mental health app project.
"""
import os
import sys
import logging
from pathlib import Path
from dotenv import load_dotenv
from django.core.management.utils import get_random_secret_key

load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# ============================================================================
# SECURITY SETTINGS
# ============================================================================

# SECURITY WARNING: don't run with debug turned on in production!
# Default to False for production, set DJANGO_DEBUG=True in .env for development
DEBUG = os.getenv('DJANGO_DEBUG', 'False').lower() in ('true', '1', 'yes')

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('SECRET_KEY')
if not SECRET_KEY:
    # SECURITY: In production, fail if SECRET_KEY is not set
    if not DEBUG:
        raise ValueError("SECRET_KEY must be set in production! Set it in .env file or environment variables.")
    # Generate a new secret key if not provided (for development only)
    SECRET_KEY = get_random_secret_key()
    import sys
    sys.stderr.write("WARNING: Generated new SECRET_KEY. Save this to .env file:\n")
    sys.stderr.write(f"SECRET_KEY={SECRET_KEY}\n")
    # Don't print to stdout (could be logged)

# SECURITY: ALLOWED_HOSTS - never include 0.0.0.0 (it's not a valid hostname)
# For mobile testing, use actual IP address
default_hosts = 'newmood.space,www.newmood.space,localhost,127.0.0.1'
# Add network IP if provided via environment variable
network_ip = os.getenv('NETWORK_IP', '')
if network_ip:
    default_hosts += f',{network_ip}'
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', default_hosts).split(',')
ALLOWED_HOSTS = [h.strip() for h in ALLOWED_HOSTS if h.strip() and h.strip() != '0.0.0.0']  # Remove empty strings and 0.0.0.0

# SECURITY: Session configuration
SESSION_COOKIE_AGE = int(os.getenv('SESSION_COOKIE_AGE', '86400'))  # 24 hours default
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_SAVE_EVERY_REQUEST = True  # Extend session on activity
SESSION_EXPIRE_AT_BROWSER_CLOSE = True

# Security settings (only in production)
if not DEBUG:
    SECURE_SSL_REDIRECT = os.getenv('SECURE_SSL_REDIRECT', 'True').lower() in ('true', '1', 'yes')
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
    SECURE_HSTS_SECONDS = int(os.getenv('SECURE_HSTS_SECONDS', '31536000'))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    # SECURITY: Content Security Policy
    SECURE_CONTENT_SECURITY_POLICY = {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],  # Allow inline for React
        'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        'font-src': ["'self'", "https://fonts.gstatic.com"],
        'img-src': ["'self'", "data:", "https:"],
        'connect-src': ["'self'", "https://api.openai.com"],
        'frame-ancestors': ["'none'"],
    }
else:
    # Development mode - disable SSL redirects but keep other security
    SECURE_SSL_REDIRECT = False
    SESSION_COOKIE_SECURE = False  # Allow HTTP in dev
    CSRF_COOKIE_SECURE = False  # Allow HTTP in dev
    SECURE_BROWSER_XSS_FILTER = True  # Keep enabled
    SECURE_CONTENT_TYPE_NOSNIFF = True  # Keep enabled
    X_FRAME_OPTIONS = 'SAMEORIGIN'

# ============================================================================
# APPLICATION DEFINITION
# ============================================================================

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'channels',
    'api',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    # SECURITY: Add CSP headers via SecurityMiddleware (configured below)
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'


# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================

# Database configuration
# Default to SQLite for development (easier setup)
# To use PostgreSQL, set DB_ENGINE=django.db.backends.postgresql in .env file
DB_ENGINE = os.getenv('DB_ENGINE', 'django.db.backends.sqlite3')

if DB_ENGINE == 'django.db.backends.sqlite3' or not DB_ENGINE or DB_ENGINE == '':
    # Use SQLite for development (default)
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
else:
    # PostgreSQL configuration (only if explicitly set in .env)
    DB_NAME = os.getenv('DB_NAME', 'mental_health_app')
    DB_USER = os.getenv('DB_USER', 'mental_health_user')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '')
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = os.getenv('DB_PORT', '5432')
    
    DATABASES = {
        'default': {
            'ENGINE': DB_ENGINE,
            'NAME': DB_NAME,
            'USER': DB_USER,
            'PASSWORD': DB_PASSWORD,
            'HOST': DB_HOST,
            'PORT': DB_PORT,
            'OPTIONS': {
                'connect_timeout': 10,
            },
            'CONN_MAX_AGE': 600,  # Connection pooling
        }
    }


# ============================================================================
# PASSWORD VALIDATION
# ============================================================================

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 8,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# ============================================================================
# INTERNATIONALIZATION
# ============================================================================

LANGUAGE_CODE = 'ru-ru'
TIME_ZONE = 'Europe/Moscow'
USE_I18N = True
USE_TZ = True


# ============================================================================
# STATIC FILES
# ============================================================================

STATIC_URL = '/static/'
STATIC_ROOT = '/var/www/newmood.space/static/'
# STATICFILES_DIRS - React build files
# Note: BASE_DIR is backend/, so we go up one level to reach frontend/
STATICFILES_DIRS = [
    os.path.join(BASE_DIR.parent, 'frontend/build/static'),  # React build files
] if os.path.exists(os.path.join(BASE_DIR.parent, 'frontend/build/static')) else []

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = '/var/www/newmood.space/media/'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# ============================================================================
# REST FRAMEWORK CONFIGURATION
# ============================================================================

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'PAGE_SIZE_QUERY_PARAM': 'page_size',
    'MAX_PAGE_SIZE': 100,  # SECURITY: Prevent DoS through large page sizes
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
    ],
}

# SECURITY: Disable browsable API in production
if not DEBUG:
    REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'] = [
        'rest_framework.renderers.JSONRenderer',
    ]
else:
    REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'] = [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ]

# SECURITY: Proxy SSL header configuration (for reverse proxy/load balancer)
# If behind a reverse proxy (nginx, Apache, etc.), uncomment and configure:
# SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
# USE_X_FORWARDED_HOST = True
# USE_X_FORWARDED_PORT = True


# ============================================================================
# CORS CONFIGURATION
# ============================================================================

# SECURITY: CORS settings - restrict in all environments
# Only allow specific origins, never allow all
CORS_ALLOW_ALL_ORIGINS = False
if DEBUG:
    # In development, allow localhost and network IP
    network_ip = os.getenv('NETWORK_IP', '')
    allowed_origins = [
        'http://localhost:8080', 'http://127.0.0.1:8080',
        'http://localhost:2011', 'http://127.0.0.1:2011',
        'http://localhost:8013', 'http://127.0.0.1:8013',
        'http://localhost:8050', 'http://127.0.0.1:8050',
        'https://newmood.space', 'http://newmood.space', 
        'https://www.newmood.space', 'http://www.newmood.space'
    ]
    if network_ip:
        allowed_origins.append(f'http://{network_ip}:8080')
        allowed_origins.append(f'http://{network_ip}:2011')
        allowed_origins.append(f'http://{network_ip}:8050')
    CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', ','.join(allowed_origins)).split(',')
else:
    CORS_ALLOWED_ORIGINS = os.getenv(
        'CORS_ALLOWED_ORIGINS',
        'http://localhost:8080,http://127.0.0.1:8080,http://localhost:2011,http://127.0.0.1:2011,http://localhost:8050,http://127.0.0.1:8050,https://newmood.space,https://www.newmood.space'
    ).split(',')

CORS_ALLOWED_ORIGINS = [origin.strip() for origin in CORS_ALLOWED_ORIGINS if origin.strip()]
CORS_ALLOW_CREDENTIALS = True

# SECURITY: CSRF settings - sync with CORS
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:8080', 
    'http://127.0.0.1:8080',
    'http://localhost:2011',
    'http://127.0.0.1:2011',
    'http://localhost:8013',
    'http://127.0.0.1:8013',
    'http://localhost:8050',
    'http://127.0.0.1:8050',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'https://newmood.space',
    'http://newmood.space',
    'https://www.newmood.space',
    'http://www.newmood.space'
]
# Add network IP if provided
network_ip = os.getenv('NETWORK_IP', '')
if network_ip:
    CSRF_TRUSTED_ORIGINS.extend([
        f'http://{network_ip}:8080',
        f'http://{network_ip}:2011',
        f'http://{network_ip}:8013',
        f'http://{network_ip}:8050',
        f'http://{network_ip}:8000'
    ])
if not DEBUG:
    csrf_origins = os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:8080,http://127.0.0.1:8080,http://localhost:2011,http://127.0.0.1:2011,http://localhost:8050,http://127.0.0.1:8050,https://newmood.space,https://www.newmood.space').split(',')
    CSRF_TRUSTED_ORIGINS = [origin.strip() for origin in csrf_origins if origin.strip()]


# ============================================================================
# CELERY CONFIGURATION
# ============================================================================

# SECURITY: Use JSON serializer instead of pickle to prevent code execution
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TIMEZONE = TIME_ZONE
CELERY_ENABLE_UTC = True

# SECURITY: Prevent task hijacking with predictable IDs
CELERY_TASK_ID_GENERATOR = 'celery.utils.gen_unique_id'

# ============================================================================
# CHANNELS CONFIGURATION
# ============================================================================

REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
REDIS_PORT = os.getenv('REDIS_PORT', '6379')
REDIS_PASSWORD = os.getenv('REDIS_PASSWORD', '')

if REDIS_PASSWORD:
    REDIS_URL = f'redis://:{REDIS_PASSWORD}@{REDIS_HOST}:{REDIS_PORT}/0'
else:
    REDIS_URL = f'redis://{REDIS_HOST}:{REDIS_PORT}/0'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [(REDIS_HOST, int(REDIS_PORT))],
        },
    },
}

# Fallback to InMemoryChannelLayer if Redis is not available
try:
    import redis
    r = redis.Redis(host=REDIS_HOST, port=int(REDIS_PORT), password=REDIS_PASSWORD if REDIS_PASSWORD else None)
    r.ping()
except:
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels.layers.InMemoryChannelLayer',
        },
    }


# ============================================================================
# LOGGING CONFIGURATION
# ============================================================================

# Try to use colored logging
try:
    from .colored_logging import COLORLOG_AVAILABLE
except ImportError:
    COLORLOG_AVAILABLE = False

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
        'colored': {
            '()': 'colorlog.ColoredFormatter' if COLORLOG_AVAILABLE else 'logging.Formatter',
            'format': '%(log_color)s%(levelname)-8s%(reset)s %(blue)s%(asctime)s%(reset)s '
                     '%(cyan)s[%(name)s]%(reset)s %(message)s' if COLORLOG_AVAILABLE 
                     else '%(levelname)-8s %(asctime)s [%(name)s] %(message)s',
            'datefmt': '%Y-%m-%d %H:%M:%S',
            'log_colors': {
                'DEBUG': 'cyan',
                'INFO': 'green',
                'WARNING': 'yellow',
                'ERROR': 'red',
                'CRITICAL': 'red,bg_white',
            } if COLORLOG_AVAILABLE else {},
        },
    },
    'filters': {
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'colored' if COLORLOG_AVAILABLE else 'verbose',
            'stream': sys.stdout,
        },
        'file': {
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
            'formatter': 'verbose',
        },
        'mail_admins': {
            'level': 'ERROR',
            'class': 'django.utils.log.AdminEmailHandler',
            'filters': ['require_debug_false'],
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.server': {
            'handlers': ['console'],
            'level': 'WARNING',
            'propagate': False,
        },
        'django.security': {
            'handlers': ['console', 'file'],
            'level': 'WARNING',
            'propagate': False,
        },
        'api': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# Create logs directory if it doesn't exist
LOGS_DIR = BASE_DIR / 'logs'
LOGS_DIR.mkdir(exist_ok=True)
