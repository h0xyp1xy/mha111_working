# Nginx + Gunicorn + Django deployment (no Docker)
These are **templates** for running this repo on Ubuntu with:
- **Nginx** serving the React build + proxying `/api/` and `/admin/` to Django
- **Gunicorn** running Django (systemd-managed)
- **PostgreSQL** + **Redis** as system services

See the assistant runbook for the exact copy/paste commands and where to place:
- `deploy/nginx/mha111.conf` → `/etc/nginx/sites-available/mha111`
- `deploy/systemd/mha111-gunicorn.service` → `/etc/systemd/system/mha111-gunicorn.service`
- `deploy/systemd/mha111-gunicorn.socket` → `/etc/systemd/system/mha111-gunicorn.socket`

