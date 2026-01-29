"""
Management command to initialize PostgreSQL database.
Usage: python manage.py init_db
"""
import os
import sys
from django.core.management.base import BaseCommand
from django.conf import settings
from django.db import connection


class Command(BaseCommand):
    help = 'Initialize PostgreSQL database (create database and user if needed)'

    def handle(self, *args, **options):
        db_config = settings.DATABASES['default']
        
        if db_config['ENGINE'] != 'django.db.backends.postgresql':
            self.stdout.write(
                self.style.WARNING(
                    f'Database engine is {db_config["ENGINE"]}, not PostgreSQL. '
                    'This command is for PostgreSQL only.'
                )
            )
            return

        db_name = db_config['NAME']
        db_user = db_config['USER']
        db_password = db_config['PASSWORD']
        db_host = db_config['HOST']
        db_port = db_config['PORT']

        self.stdout.write('Checking PostgreSQL connection...')

        # Try to connect to PostgreSQL server (as postgres superuser)
        try:
            import psycopg2
            # Connect to postgres database (default database)
            conn = psycopg2.connect(
                host=db_host,
                port=db_port,
                user='postgres',
                password=os.getenv('POSTGRES_SUPERUSER_PASSWORD', ''),
                database='postgres'
            )
            conn.autocommit = True
            cursor = conn.cursor()

            # Check if database exists
            cursor.execute(
                "SELECT 1 FROM pg_database WHERE datname = %s",
                (db_name,)
            )
            db_exists = cursor.fetchone()

            if not db_exists:
                # SECURITY: Validate database name to prevent SQL injection
                # PostgreSQL identifiers must match [a-zA-Z_][a-zA-Z0-9_]* pattern
                import re
                if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', db_name):
                    raise ValueError(f'Invalid database name: {db_name}. Must be a valid PostgreSQL identifier.')
                self.stdout.write(f'Creating database "{db_name}"...')
                # SECURITY: Use psycopg2.sql.Identifier for safe identifier quoting
                from psycopg2 import sql
                cursor.execute(sql.SQL('CREATE DATABASE {}').format(sql.Identifier(db_name)))
                self.stdout.write(
                    self.style.SUCCESS(f'Database "{db_name}" created')
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS(f'Database "{db_name}" already exists')
                )

            # Check if user exists
            cursor.execute(
                "SELECT 1 FROM pg_user WHERE usename = %s",
                (db_user,)
            )
            user_exists = cursor.fetchone()

            if not user_exists:
                # SECURITY: Validate username to prevent SQL injection
                import re
                if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', db_user):
                    raise ValueError(f'Invalid username: {db_user}. Must be a valid PostgreSQL identifier.')
                self.stdout.write(f'Creating user "{db_user}"...')
                # SECURITY: Use psycopg2.sql for safe SQL construction
                from psycopg2 import sql
                cursor.execute(
                    sql.SQL('CREATE USER {} WITH PASSWORD %s').format(sql.Identifier(db_user)),
                    (db_password,)
                )
                self.stdout.write(
                    self.style.SUCCESS(f'User "{db_user}" created')
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS(f'User "{db_user}" already exists')
                )

            # Grant privileges
            # SECURITY: Use psycopg2.sql for safe SQL construction
            from psycopg2 import sql
            self.stdout.write(f'Granting privileges to "{db_user}"...')
            cursor.execute(
                sql.SQL('GRANT ALL PRIVILEGES ON DATABASE {} TO {}').format(
                    sql.Identifier(db_name),
                    sql.Identifier(db_user)
                )
            )
            
            # Connect to the new database and grant schema privileges
            cursor.close()
            conn.close()

            conn = psycopg2.connect(
                host=db_host,
                port=db_port,
                user='postgres',
                password=os.getenv('POSTGRES_SUPERUSER_PASSWORD', ''),
                database=db_name
            )
            conn.autocommit = True
            cursor = conn.cursor()
            cursor.execute(
                sql.SQL('GRANT ALL ON SCHEMA public TO {}').format(sql.Identifier(db_user))
            )
            cursor.execute(
                sql.SQL('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO {}').format(
                    sql.Identifier(db_user)
                )
            )
            cursor.execute(
                sql.SQL('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO {}').format(
                    sql.Identifier(db_user)
                )
            )

            cursor.close()
            conn.close()

            self.stdout.write(
                self.style.SUCCESS('Database initialization completed successfully!')
            )
            self.stdout.write('You can now run: python manage.py migrate')

        except psycopg2.OperationalError as e:
            if 'password authentication failed' in str(e):
                self.stdout.write(
                    self.style.ERROR(
                        'Error: PostgreSQL authentication failed. '
                        'Make sure PostgreSQL is running and POSTGRES_SUPERUSER_PASSWORD '
                        'is set correctly, or run init_db.sql manually as postgres user.'
                    )
                )
            else:
                self.stdout.write(
                    self.style.ERROR(f'Error connecting to PostgreSQL: {str(e)}')
                )
            self.stdout.write(
                self.style.WARNING(
                    'You can manually run database/init_db.sql as postgres superuser:'
                )
            )
            self.stdout.write('  psql -U postgres -f backend/database/init_db.sql')
        except ImportError:
            self.stdout.write(
                self.style.ERROR('Error: psycopg2 is not installed')
            )
            self.stdout.write('Install it with: pip install psycopg2-binary')
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error: {str(e)}')
            )


