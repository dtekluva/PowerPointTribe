# ── Stage 1: build deps ────────────────────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /build

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ── Stage 2: runtime ───────────────────────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application source
COPY manage.py .
COPY orders/ orders/
COPY sunday_orders_backend/ sunday_orders_backend/

# Collect static files using base settings (no DB connection needed)
RUN DJANGO_SETTINGS_MODULE=sunday_orders_backend.production_settings \
    DATABASE_URL=sqlite:////tmp/dummy.db \
    python manage.py collectstatic --noinput

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV DJANGO_SETTINGS_MODULE=sunday_orders_backend.production_settings

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]

