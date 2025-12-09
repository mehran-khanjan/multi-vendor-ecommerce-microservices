#!/bin/sh
set -e

# Wait for PostgreSQL
if [ -n "$DB_HOST" ]; then
    echo "Waiting for PostgreSQL at $DB_HOST..."
    ./wait-for-db.sh "$DB_HOST" "echo 'PostgreSQL is ready'"
fi

# Run database migrations
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "Running database migrations..."
    npx typeorm migration:run
    echo "Migrations completed"
fi

# Run database seeds (only in non-production environments)
if [ "$NODE_ENV" != "production" ] && [ "$RUN_SEEDS" = "true" ]; then
    echo "Running database seeds..."
    npx ts-node src/database/seeds/index.ts
    echo "Seeds completed"
fi

# Start the application
exec node dist/main.js