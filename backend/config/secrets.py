"""
Utility functions for generating and managing secrets.
"""
import secrets
import string
from django.core.management.utils import get_random_secret_key


def generate_secret_key():
    """Generate a random secret key for Django."""
    return get_random_secret_key()


def generate_secure_password(length=32):
    """Generate a secure random password."""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    password = ''.join(secrets.choice(alphabet) for _ in range(length))
    return password


if __name__ == '__main__':
    print(f"Secret Key: {generate_secret_key()}")
    print(f"Secure Password: {generate_secure_password()}")


