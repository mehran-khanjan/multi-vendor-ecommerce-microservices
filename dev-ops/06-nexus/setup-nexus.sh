#!/bin/bash
set -e

echo "Setting up Nexus Repository Manager for MultiVendor Platform"

# Wait for Nexus to be ready
echo "Waiting for Nexus to be ready..."
until curl -s http://localhost:8081/service/rest/v1/status | grep -q '"state":"STARTED"'; do
    sleep 10
done

echo "Nexus is ready. Starting configuration..."

# Get admin password from initial admin file
ADMIN_PASSWORD=$(cat /nexus-data/admin.password)

# Function to make API calls to Nexus
nexus_api() {
    local method=$1
    local endpoint=$2
    local data=$3

    curl -s -X "$method" \
        -u "admin:$ADMIN_PASSWORD" \
        -H "Content-Type: application/json" \
        "http://localhost:8081/service/rest/v1/$endpoint" \
        ${data:+--data "$data"}
}

# Change admin password
echo "Changing admin password..."
nexus_api "PUT" "security/users/admin/change-password" '{
    "oldPassword": "'"$ADMIN_PASSWORD"'",
    "newPassword": "'"${NEXUS_ADMIN_PASSWORD}"'"
}'

# Update admin password variable
ADMIN_PASSWORD="${NEXUS_ADMIN_PASSWORD}"

# Create Docker repositories
echo "Creating Docker repositories..."

# Docker hosted repository
nexus_api "POST" "repositories/docker/hosted" '{
    "name": "multivendor-docker-hosted",
    "online": true,
    "storage": {
        "blobStoreName": "default",
        "strictContentTypeValidation": true,
        "writePolicy": "ALLOW_ONCE"
    },
    "docker": {
        "v1Enabled": false,
        "forceBasicAuth": true,
        "httpPort": 8082
    }
}'

# Docker proxy repository (Docker Hub)
nexus_api "POST" "repositories/docker/proxy" '{
    "name": "docker-hub-proxy",
    "online": true,
    "storage": {
        "blobStoreName": "default",
        "strictContentTypeValidation": true
    },
    "cleanup": null,
    "docker": {
        "v1Enabled": false,
        "forceBasicAuth": true,
        "httpPort": null
    },
    "proxy": {
        "remoteUrl": "https://registry-1.docker.io",
        "contentMaxAge": 1440,
        "metadataMaxAge": 1440
    },
    "negativeCache": {
        "enabled": true,
        "timeToLive": 1440
    },
    "httpClient": {
        "blocked": false,
        "autoBlock": true,
        "connection": {
            "retries": 0,
            "userAgentSuffix": "Nexus",
            "timeout": 60,
            "enableCircularRedirects": false,
            "enableCookies": false
        }
    },
    "routingRule": null,
    "format": "docker",
    "type": "proxy"
}'

# Docker group repository
nexus_api "POST" "repositories/docker/group" '{
    "name": "multivendor-docker-group",
    "online": true,
    "storage": {
        "blobStoreName": "default",
        "strictContentTypeValidation": true
    },
    "group": {
        "memberNames": ["multivendor-docker-hosted", "docker-hub-proxy"]
    },
    "docker": {
        "v1Enabled": false,
        "forceBasicAuth": true,
        "httpPort": null
    }
}'

# Create NPM repositories
echo "Creating NPM repositories..."

# NPM hosted repository
nexus_api "POST" "repositories/npm/hosted" '{
    "name": "multivendor-npm-hosted",
    "online": true,
    "storage": {
        "blobStoreName": "default",
        "strictContentTypeValidation": true,
        "writePolicy": "ALLOW_ONCE"
    }
}'

# NPM proxy repository
nexus_api "POST" "repositories/npm/proxy" '{
    "name": "npmjs-proxy",
    "online": true,
    "storage": {
        "blobStoreName": "default",
        "strictContentTypeValidation": true
    },
    "cleanup": null,
    "proxy": {
        "remoteUrl": "https://registry.npmjs.org",
        "contentMaxAge": 1440,
        "metadataMaxAge": 1440
    },
    "negativeCache": {
        "enabled": true,
        "timeToLive": 1440
    },
    "httpClient": {
        "blocked": false,
        "autoBlock": true,
        "connection": {
            "retries": 0,
            "userAgentSuffix": "Nexus",
            "timeout": 60,
            "enableCircularRedirects": false,
            "enableCookies": false
        }
    }
}'

# NPM group repository
nexus_api "POST" "repositories/npm/group" '{
    "name": "multivendor-npm-group",
    "online": true,
    "storage": {
        "blobStoreName": "default",
        "strictContentTypeValidation": true
    },
    "group": {
        "memberNames": ["multivendor-npm-hosted", "npmjs-proxy"]
    }
}'

# Create raw repository for build artifacts
echo "Creating raw repository..."
nexus_api "POST" "repositories/raw/hosted" '{
    "name": "multivendor-raw-hosted",
    "online": true,
    "storage": {
        "blobStoreName": "default",
        "strictContentTypeValidation": true,
        "writePolicy": "ALLOW_ONCE"
    },
    "raw": {
        "contentDisposition": "ATTACHMENT"
    }
}'

# Create roles
echo "Creating roles..."

# Deploy role
nexus_api "POST" "security/roles" '{
    "id": "multivendor-deploy-role",
    "name": "multivendor-deploy",
    "description": "Role for deployment team",
    "privileges": [
        "nx-repository-view-*-*-*",
        "nx-repository-admin-*-*-*"
    ],
    "roles": []
}'

# Read-only role
nexus_api "POST" "security/roles" '{
    "id": "multivendor-read-role",
    "name": "multivendor-read",
    "description": "Role for reading artifacts",
    "privileges": [
        "nx-repository-view-*-*-read"
    ],
    "roles": []
}'

# Create users
echo "Creating users..."

# Jenkins user
nexus_api "POST" "security/users" '{
    "userId": "jenkins",
    "firstName": "Jenkins",
    "lastName": "CI/CD",
    "emailAddress": "jenkins@example.com",
    "password": "'"${NEXUS_JENKINS_PASSWORD}"'",
    "status": "active",
    "roles": ["multivendor-deploy-role"]
}'

# GitHub Actions user
nexus_api "POST" "security/users" '{
    "userId": "github-actions",
    "firstName": "GitHub",
    "lastName": "Actions",
    "emailAddress": "github-actions@example.com",
    "password": "'"${NEXUS_GITHUB_PASSWORD}"'",
    "status": "active",
    "roles": ["multivendor-deploy-role"]
}'

# Create cleanup policy
echo "Creating cleanup policy..."
nexus_api "POST" "v1/script" '{
    "name": "cleanup-policy",
    "type": "groovy",
    "content": "repository.createCleanupPolicy(''multivendor-cleanup-policy'', '''.*''', [lastDownloaded: 30, lastBlobUpdated: 90], '''delete''')"
}'

nexus_api "POST" "v1/script/cleanup-policy/run" "{}"

echo "Nexus configuration completed successfully!"
echo "==========================================="
echo "Docker Registry: http://localhost:8082/repository/multivendor-docker-group/"
echo "NPM Registry: http://localhost:8081/repository/multivendor-npm-group/"
echo "Raw Repository: http://localhost:8081/repository/multivendor-raw-hosted/"
echo "==========================================="