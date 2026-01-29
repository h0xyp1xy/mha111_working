# Database Setup Instructions

## PostgreSQL Installation

### macOS (using Homebrew)
```bash
brew install postgresql@14
brew services start postgresql@14
```

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Windows
Download and install from: https://www.postgresql.org/download/windows/

## Database Initialization

### Option 1: Using init_db.sql (Manual)
1. Make sure PostgreSQL is running
2. Edit `init_db.sql` and change `CHANGE_THIS_PASSWORD_IN_ENV` to your desired password
3. Run as postgres superuser:
```bash
psql -U postgres -f init_db.sql
```

### Option 2: Using Django Management Command (Recommended)
```bash
python manage.py init_db
```

This command will:
- Check if PostgreSQL is accessible
- Create database if it doesn't exist
- Create user if it doesn't exist
- Set proper permissions

## Environment Variables

Make sure your `.env` file contains:
```env
DB_ENGINE=django.db.backends.postgresql
DB_NAME=mental_health_app
DB_USER=mental_health_user
DB_PASSWORD=your_secure_password_here
DB_HOST=localhost
DB_PORT=5432
```

## Running Migrations

After database is set up, run Django migrations:
```bash
python manage.py migrate
```

## Creating Admin User

Create admin user using management command:
```bash
python manage.py create_admin
```

Or use Django's built-in command:
```bash
python manage.py createsuperuser
```

## Backup and Restore

### Backup
```bash
pg_dump -U mental_health_user -d mental_health_app > backup.sql
```

### Restore
```bash
psql -U mental_health_user -d mental_health_app < backup.sql
```


