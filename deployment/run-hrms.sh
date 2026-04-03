#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="/opt/hrms"
VENV_BIN="$APP_ROOT/venv/bin"
BACKEND_HOST="${BACKEND_HOST:-127.0.0.1}"
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_HOST="${FRONTEND_HOST:-0.0.0.0}"
FRONTEND_PORT="${FRONTEND_PORT:-8787}"

export PATH="$VENV_BIN:$PATH"
export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-http://127.0.0.1:${BACKEND_PORT}}"

cleanup() {
  if [[ -n "${BACKEND_PID:-}" ]] && kill -0 "${BACKEND_PID}" 2>/dev/null; then
    kill "${BACKEND_PID}" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

cd "$APP_ROOT/backend"
gunicorn app.main:app \
  -w "${BACKEND_WORKERS:-4}" \
  -k uvicorn.workers.UvicornWorker \
  -b "${BACKEND_HOST}:${BACKEND_PORT}" &
BACKEND_PID=$!

cd "$APP_ROOT/frontend"
npm run start -- -H "${FRONTEND_HOST}" -p "${FRONTEND_PORT}" &
FRONTEND_PID=$!

# Keep service alive while one of the child processes is running.
wait -n "$BACKEND_PID" "$FRONTEND_PID"
