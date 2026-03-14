FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /app

# Install system dependencies (including Pillow requirements)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-client \
        libjpeg62-turbo-dev \
        zlib1g-dev \
        libpng-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy Django project and data files
COPY . /app/

# Collect static files
RUN python manage.py collectstatic --noinput 2>/dev/null || true

# Expose port
EXPOSE 8000

# Run migrations, seed data, then start gunicorn
CMD bash -c "python manage.py migrate && (python manage.py seed_products || true) && gunicorn urbanstems_backend.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 3"
