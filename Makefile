.PHONY: help build up down restart logs shell migrate createsuperuser collectstatic test clean

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build all Docker images
	docker-compose build

up: ## Start all services
	docker-compose up -d

down: ## Stop all services
	docker-compose down

restart: ## Restart all services
	docker-compose restart

logs: ## Show logs from all services
	docker-compose logs -f

logs-backend: ## Show backend logs
	docker-compose logs -f backend

logs-frontend: ## Show frontend logs
	docker-compose logs -f frontend

shell-backend: ## Open shell in backend container
	docker-compose exec backend bash

shell-frontend: ## Open shell in frontend container
	docker-compose exec frontend sh

migrate: ## Run database migrations
	docker-compose exec backend python manage.py migrate

makemigrations: ## Create new migrations
	docker-compose exec backend python manage.py makemigrations

createsuperuser: ## Create Django superuser
	docker-compose exec backend python manage.py createsuperuser

collectstatic: ## Collect static files
	docker-compose exec backend python manage.py collectstatic --noinput

test: ## Run tests
	docker-compose exec backend python manage.py test

shell-db: ## Open PostgreSQL shell
	docker-compose exec db psql -U mental_health_user -d mental_health_app

backup-db: ## Backup database
	docker-compose exec db pg_dump -U mental_health_user mental_health_app > backup_$(shell date +%Y%m%d_%H%M%S).sql

clean: ## Remove containers, volumes and images
	docker-compose down -v --rmi all

clean-all: clean ## Remove everything including unused Docker resources
	docker system prune -a --volumes

rebuild: ## Rebuild all images without cache
	docker-compose build --no-cache

ps: ## Show running containers
	docker-compose ps

celery: ## Start Celery services
	docker-compose --profile celery up -d celery celery-beat

stop-celery: ## Stop Celery services
	docker-compose stop celery celery-beat
