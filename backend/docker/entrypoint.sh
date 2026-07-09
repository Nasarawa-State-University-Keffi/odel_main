#!/bin/sh
set -eu

if [ "${1:-}" = "gunicorn" ]; then
  if [ "${RUN_MIGRATIONS:-1}" = "1" ]; then
    python manage.py migrate --noinput
  fi

  if [ "${RUN_COLLECTSTATIC:-1}" = "1" ]; then
    python manage.py collectstatic --noinput
  fi
fi

exec "$@"
