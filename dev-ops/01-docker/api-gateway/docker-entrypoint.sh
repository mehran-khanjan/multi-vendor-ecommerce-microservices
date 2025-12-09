#!/bin/sh
set -e

# Wait for dependencies (if any)
if [ -n "$WAIT_FOR_HOSTS" ]; then
    for host in $(echo $WAIT_FOR_HOSTS | sed "s/,/ /g"); do
        echo "Waiting for $host..."
        while ! nc -z $(echo $host | sed "s/:/ /"); do
            sleep 1
        done
        echo "$host is available"
    done
fi

# Run database migrations (if applicable)
# npx typeorm migration:run

# Start the application
exec node dist/main.js