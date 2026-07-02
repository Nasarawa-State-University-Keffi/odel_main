###############################################
# Multi-stage build for production Django app
###############################################

# Stage 1: Builder - Compile dependencies
FROM python:3.11-slim as builder

# Prevents Python from writing pyc files and buffering stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libpq-dev \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt


# Stage 2: Final production image
FROM python:3.11-slim

# Build-time argument for a dummy secret key (only used for collectstatic)
ARG DJANGO_SECRET_KEY=dummy-build-time-secret-key-not-used-in-production

# Environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=lms.settings \
    DJANGO_ENV=production \
    DJANGO_SECRET_KEY=${DJANGO_SECRET_KEY}

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Set work directory
WORKDIR /app

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy compiled wheels from builder
COPY --from=builder /app/wheels /wheels
COPY --from=builder /app/requirements.txt .

# Install dependencies from wheels
RUN pip install --no-cache /wheels/*

# Copy project files
COPY --chown=appuser:appuser . .

# Create necessary directories with proper permissions
RUN mkdir -p /app/media /app/staticfiles /app/logs && \
    chown -R appuser:appuser /app/media /app/staticfiles /app/logs

# Collect static files (uses dummy secret key from build arg)
RUN python manage.py collectstatic --noinput --clear

# Unset the build-time secret key so it's not baked into the final image
# The real DJANGO_SECRET_KEY must be provided at runtime via environment variables
ENV DJANGO_SECRET_KEY=

# Switch to non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/api/ || exit 1

# Expose port
EXPOSE 8000

# Use gunicorn for production (overrideable via docker-compose)
CMD ["gunicorn", "--config", "gunicorn_config.py", "lms.wsgi:application"]
