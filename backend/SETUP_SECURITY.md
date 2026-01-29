# Security Setup Instructions

## Overview

This document describes the security improvements implemented in the application.

## Security Features

### 1. PostgreSQL Database
- Migrated from SQLite to PostgreSQL for better security and performance
- Separate database user with limited privileges
- Connection pooling enabled
- Database credentials stored in environment variables

### 2. Environment Variables
- All secrets moved to `.env` file (not committed to git)
- `.env.example` file provided as a template
- No hardcoded passwords or secrets in code

### 3. Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (HSTS) in production
- Secure cookies in production mode

### 4. Rate Limiting
- Login endpoint: 5 attempts per minute per IP
- Registration endpoint: 3 attempts per hour per IP
- Prevents brute force attacks

### 5. Authentication
- Removed hardcoded admin credentials
- All authentication uses Django's secure password hashing
- Failed login attempts are logged
- Admin user created via management command

### 6. Debug Mode
- `DEBUG=False` in production (set via `DJANGO_DEBUG` env var)
- Error details only shown in DEBUG mode
- Production logging configured

### 7. CORS Configuration
- Restricted to specific origins
- Credentials enabled only for trusted origins

## Setup Instructions

### 1. Install PostgreSQL

**macOS (Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Create Environment File

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` and set all required values:
- Generate a secret key: `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`
- Set strong database password
- Set admin credentials
- Configure allowed hosts for production

### 3. Initialize Database

**Option A: Using Management Command (Recommended)**
```bash
python manage.py init_db
```

**Option B: Manual Setup**
```bash
# As postgres superuser
psql -U postgres -f database/init_db.sql
# Edit init_db.sql to set password before running
```

### 4. Run Migrations

```bash
python manage.py migrate
```

### 5. Create Admin User

```bash
python manage.py create_admin
```

Or use Django's built-in command:
```bash
python manage.py createsuperuser
```

### 6. Collect Static Files

```bash
python manage.py collectstatic
```

### 7. Run Server

For development:
```bash
python manage.py runserver
```

For production, use a WSGI server like Gunicorn with proper configuration.

## Security Checklist

Before deploying to production, ensure:

- [ ] `DEBUG=False` in `.env`
- [ ] `SECRET_KEY` is set to a strong random value
- [ ] `ALLOWED_HOSTS` includes your domain
- [ ] Database password is strong
- [ ] Admin password is strong
- [ ] `SECURE_SSL_REDIRECT=True` if using HTTPS
- [ ] HTTPS is properly configured
- [ ] `.env` file is not committed to git
- [ ] Database backups are configured
- [ ] Logging is properly configured
- [ ] Rate limiting is enabled

## Troubleshooting

### Database Connection Errors

1. Check PostgreSQL is running: `pg_isready`
2. Verify credentials in `.env`
3. Check database exists: `psql -U postgres -l`
4. Verify user permissions

### Rate Limiting Issues

Rate limiting uses the default cache backend. Ensure caching is configured properly.

### Security Headers Not Working

Security headers only apply when `DEBUG=False`. Make sure `DJANGO_DEBUG=False` in `.env`.

## Additional Security Recommendations

1. **Regular Updates**: Keep Django and dependencies updated
2. **Backup Strategy**: Implement regular database backups
3. **Monitoring**: Set up logging and monitoring for security events
4. **SSL/TLS**: Always use HTTPS in production
5. **Firewall**: Configure firewall rules appropriately
6. **Access Control**: Limit server access to authorized personnel only


