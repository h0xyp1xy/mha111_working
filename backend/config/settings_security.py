"""
Additional security settings documentation.
This file contains security best practices and recommendations.
"""

# Rate limiting configuration for django-ratelimit
# Applied via decorators in views.py

RATELIMIT_ENABLE = True
RATELIMIT_USE_CACHE = 'default'  # Use default cache backend

# Rate limits (can be configured per endpoint)
# Format: 'number/period' where period is: s (second), m (minute), h (hour), d (day)
RATE_LIMITS = {
    'login': '5/m',  # 5 attempts per minute
    'register': '3/h',  # 3 attempts per hour
    'api': '100/m',  # 100 requests per minute for general API
    'api_write': '60/m',  # 60 write operations per minute
}

# Security headers (configured in settings.py)
# - X-Content-Type-Options: nosniff
# - X-Frame-Options: DENY
# - X-XSS-Protection: 1; mode=block
# - Strict-Transport-Security (HSTS): configured in settings.py

# Password requirements (configured via AUTH_PASSWORD_VALIDATORS)
# - Minimum length: 8 characters
# - Cannot be entirely numeric
# - Cannot be too common
# - Cannot be too similar to user attributes


