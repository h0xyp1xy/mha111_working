# Быстрый старт с Docker

## 1. Установите Docker и Docker Compose

```bash
# Проверьте установку
docker --version
docker-compose --version
```

## 2. Создайте файл `.env`

```bash
cp .env.example .env
```

Отредактируйте `.env` и установите:
- `SECRET_KEY` - сгенерируйте: `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`
- `DB_PASSWORD` - надежный пароль для PostgreSQL
- `REDIS_PASSWORD` - пароль для Redis (опционально)

## 3. Запустите приложение

```bash
# Сборка и запуск
docker-compose up -d --build

# Или используйте Makefile
make build
make up
```

## 4. Создайте суперпользователя

```bash
docker-compose exec backend python manage.py createsuperuser
```

## 5. Откройте в браузере

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **Admin Panel:** http://localhost:8000/admin

## Полезные команды

```bash
# Просмотр логов
docker-compose logs -f

# Остановка
docker-compose down

# Перезапуск
docker-compose restart

# Или используйте Makefile
make help  # Показать все доступные команды
```

## Troubleshooting

### Проблемы с подключением к БД

```bash
# Проверить статус
docker-compose ps

# Проверить логи
docker-compose logs db
```

### Применить миграции

```bash
docker-compose exec backend python manage.py migrate
```

### Пересобрать образы

```bash
docker-compose build --no-cache
docker-compose up -d
```

Полная документация: см. `DOCKER.md`
