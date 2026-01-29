"""
Management command to create admin user.
Usage: python manage.py create_admin
"""
import os
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.db import IntegrityError


class Command(BaseCommand):
    help = 'Create admin user from environment variables'

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            type=str,
            help='Admin username (default: from ADMIN_USERNAME env var)',
        )
        parser.add_argument(
            '--password',
            type=str,
            help='Admin password (default: from ADMIN_PASSWORD env var)',
        )
        parser.add_argument(
            '--email',
            type=str,
            help='Admin email (default: from ADMIN_EMAIL env var)',
        )

    def handle(self, *args, **options):
        username = options.get('username') or os.getenv('ADMIN_USERNAME', 'admin')
        password = options.get('password') or os.getenv('ADMIN_PASSWORD')
        email = options.get('email') or os.getenv('ADMIN_EMAIL', 'admin@example.com')

        if not password:
            self.stdout.write(
                self.style.ERROR(
                    'Error: ADMIN_PASSWORD environment variable is not set. '
                    'Please set it in .env file or use --password argument.'
                )
            )
            return

        try:
            # Check if user already exists
            if User.objects.filter(username=username).exists():
                user = User.objects.get(username=username)
                user.set_password(password)
                user.email = email
                user.is_staff = True
                user.is_superuser = True
                user.save()
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Successfully updated admin user "{username}"'
                    )
                )
            else:
                # Create new admin user
                User.objects.create_superuser(
                    username=username,
                    email=email,
                    password=password
                )
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Successfully created admin user "{username}"'
                    )
                )
        except IntegrityError:
            self.stdout.write(
                self.style.ERROR(f'Error: User "{username}" already exists')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error creating admin user: {str(e)}')
            )


