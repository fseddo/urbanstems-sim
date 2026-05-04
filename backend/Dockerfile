FROM python:3.11.15-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /app

# Install system dependencies (Pillow + curl/tar for entrypoint GeoIP download)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-client \
        libjpeg62-turbo-dev \
        zlib1g-dev \
        libpng-dev \
        curl \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy Django project and data files
COPY . /app/

# Make entrypoint executable (covers cases where the host filesystem stripped
# the executable bit before COPY, e.g. on Windows hosts).
RUN chmod +x /app/entrypoint.sh

# Collect static files
RUN python manage.py collectstatic --noinput 2>/dev/null || true

# Expose port
EXPOSE 8000

# Entrypoint refreshes the GeoIP DB if needed, then runs the supplied CMD.
ENTRYPOINT ["/app/entrypoint.sh"]

# Run migrations, optionally reseed data, then start gunicorn.
# Migrations are idempotent and always run. Seeding wipes-and-rebuilds the
# catalog (destructive: drops admin edits, churns IDs); gated on SEED_ON_BOOT
# so prod doesn't reseed on every restart. Flip SEED_ON_BOOT=true on Railway
# for one deploy after updating products.json, then unset.
CMD ["bash", "-c", "set -e; \
python manage.py migrate; \
if [ \"${SEED_ON_BOOT:-false}\" = \"true\" ]; then \
  (python manage.py seed_products --clear || true); \
  (python manage.py generate_blur_placeholders || true); \
fi; \
exec gunicorn urbanstems_backend.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 3"]
