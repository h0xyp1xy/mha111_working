# Docker Setup Guide

Это руководство по запуску приложения в Docker контейнерах.

## Требования

- Docker >= 20.10
- Docker Compose >= 2.0

## Быстрый старт

### 1. Клонируйте репозиторий (если еще не сделано)

```bash
git clone <repository-url>
cd mental-health-app-broken
```

### 2. Создайте файл `.env`

```bash
cp .env.example .env
```

Отредактируйте `.env` и установите необходимые значения:
- `SECRET_KEY` - сгенерируйте сильный секретный ключ
- `DB_PASSWORD` - установите надежный пароль для PostgreSQL
- `REDIS_PASSWORD` - установите пароль для Redis
- `ALLOWED_HOSTS` - добавьте ваш домен
- `CORS_ALLOWED_ORIGINS` - добавьте ваш frontend URL

### 3. Запустите приложение

```bash
# Запустить все сервисы
docker-compose up -d

# Или с логированием
docker-compose up
```

### 4. Создайте суперпользователя (опционально)

```bash
docker-compose exec backend python manage.py createsuperuser
```

Или установите `CREATE_SUPERUSER=true` в `.env` для автоматического создания (только для разработки).

### 5. Доступ к приложению

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Admin Panel: http://localhost:8000/admin

## Структура сервисов

### Основные сервисы

- **db** - PostgreSQL база данных
- **redis** - Redis для кэширования и Channels
- **backend** - Django приложение (Gunicorn)
- **frontend** - React приложение (Nginx)

### Опциональные сервисы

- **celery** - Celery worker для фоновых задач
- **celery-beat** - Celery beat для периодических задач

## Команды

### Запуск

```bash
# Запустить все сервисы
docker-compose up -d

# Запустить с Celery
docker-compose --profile celery up -d

# Запустить только определенные сервисы
docker-compose up db redis backend
```

### Остановка

```bash
# Остановить все сервисы
docker-compose down

# Остановить и удалить volumes (ОСТОРОЖНО: удалит данные!)
docker-compose down -v
```

### Логи

```bash
# Все логи
docker-compose logs

# Логи конкретного сервиса
docker-compose logs backend
docker-compose logs frontend

# Следить за логами в реальном времени
docker-compose logs -f backend
```

### Выполнение команд

```bash
# Django management команды
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
docker-compose exec backend python manage.py collectstatic

# Shell доступ
docker-compose exec backend bash
docker-compose exec frontend sh

# PostgreSQL доступ
docker-compose exec db psql -U mental_health_user -d mental_health_app
```

### Пересборка

```bash
# Пересобрать все образы
docker-compose build

# Пересобрать без кэша
docker-compose build --no-cache

# Пересобрать конкретный сервис
docker-compose build backend
```

## Переменные окружения

Основные переменные в `.env`:

```env
# Django
DEBUG=False
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1,yourdomain.com
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# Database
DB_NAME=mental_health_app
DB_USER=mental_health_user
DB_PASSWORD=strong-password
DB_HOST=db
DB_PORT=5432

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis-password

# Ports
BACKEND_PORT=8000
FRONTEND_PORT=3000

# Frontend
VITE_API_URL=http://localhost:8000

# OpenAI (optional)
OPENAI_API_KEY=your-openai-key

# Development
CREATE_SUPERUSER=false
```

## Production настройки

### 1. Обновите `.env` для production

```env
DEBUG=False
SECRET_KEY=<strong-random-key>
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
DB_PASSWORD=<strong-database-password>
REDIS_PASSWORD=<strong-redis-password>
```

### 2. Используйте внешний PostgreSQL (опционально)

Если используете внешнюю БД, удалите сервис `db` из `docker-compose.yml` и обновите `DB_HOST` в `.env`.

### 3. Настройте reverse proxy (Nginx/Traefik)

Для production рекомендуется использовать Nginx или Traefik перед Docker контейнерами.

### 4. Настройте SSL/TLS

Используйте Let's Encrypt или другой SSL сертификат через reverse proxy.

### 5. Настройте резервное копирование

```bash
# Backup PostgreSQL
docker-compose exec db pg_dump -U mental_health_user mental_health_app > backup.sql

# Restore
docker-compose exec -T db psql -U mental_health_user mental_health_app < backup.sql
```

## Troubleshooting

### Проблемы с подключением к БД

```bash
# Проверить статус БД
docker-compose ps db

# Проверить логи БД
docker-compose logs db

# Проверить подключение
docker-compose exec backend python manage.py dbshell
```

### Проблемы с миграциями

```bash
# Применить миграции
docker-compose exec backend python manage.py migrate

# Сбросить миграции (ОСТОРОЖНО!)
docker-compose exec backend python manage.py migrate --fake-initial
```

### Проблемы с статическими файлами

```bash
# Собрать статические файлы
docker-compose exec backend python manage.py collectstatic --noinput
```

### Проблемы с Redis

```bash
# Проверить статус Redis
docker-compose exec redis redis-cli ping

# С паролем
docker-compose exec redis redis-cli -a $REDIS_PASSWORD ping
```

### Очистка

```bash
# Остановить и удалить контейнеры
docker-compose down

# Удалить volumes (удалит данные БД!)
docker-compose down -v

# Удалить образы
docker-compose down --rmi all

# Полная очистка
docker system prune -a --volumes
```

## Мониторинг

### Health checks

Все сервисы имеют health checks. Проверить статус:

```bash
docker-compose ps
```

### Логи

```bash
# Все логи
docker-compose logs

# Последние 100 строк
docker-compose logs --tail=100

# Следить за логами
docker-compose logs -f
```

## Разработка

### Hot reload для backend

Backend код монтируется как volume, поэтому изменения применяются автоматически. Перезапустите контейнер:

```bash
docker-compose restart backend
```

### Hot reload для frontend

Для разработки frontend лучше запускать локально:

```bash
cd frontend
npm run dev
```

Или используйте volume mount для hot reload в Docker (требует дополнительной настройки).

## Безопасность

1. **Никогда не коммитьте `.env` файл**
2. **Используйте сильные пароли** для БД и Redis
3. **Обновляйте зависимости** регулярно
4. **Используйте HTTPS** в production
5. **Настройте firewall** для ограничения доступа к портам
6. **Регулярно делайте бэкапы** БД

## Дополнительные ресурсы

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Django Deployment Checklist](https://docs.djangoproject.com/en/stable/howto/deployment/checklist/)
