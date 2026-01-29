# Установка зависимостей

## Установка django-ratelimit

Для работы rate limiting нужно установить пакет django-ratelimit:

```bash
cd backend
source venv/bin/activate
pip install django-ratelimit==4.1.0
```

Или если виртуальное окружение не активировано:

```bash
cd backend
python -m pip install django-ratelimit==4.1.0
```

## Примечание

Код будет работать даже без этого пакета (rate limiting просто будет отключен), но для полноценной работы безопасности рекомендуется установить пакет.


