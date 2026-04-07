#!/bin/sh
set -eu

echo "Applying Prisma migrations..."
npx prisma migrate deploy
npx prisma db push

echo "Starting backend server..."
node dist/main.js &
APP_PID=$!

cleanup() {
  if kill -0 "$APP_PID" >/dev/null 2>&1; then
    kill "$APP_PID" || true
  fi
}

trap cleanup INT TERM EXIT

echo "Running startup smoke test..."
node dist/scripts/smoke-test.js

echo "Smoke test passed. Keeping backend running."
wait "$APP_PID"
