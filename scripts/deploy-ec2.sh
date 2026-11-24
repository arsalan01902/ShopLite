#!/bin/bash
set -e

REGION="eu-north-1"
ACCOUNT_ID="666729139738"
REGISTRY="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"

echo "Logging in to Amazon ECR..."
aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$REGISTRY"

echo "Pulling updated images..."
docker pull "$REGISTRY/shoplite-catalog:latest"
docker pull "$REGISTRY/shoplite-inventory:latest"
docker pull "$REGISTRY/shoplite-orders:latest"
docker pull "$REGISTRY/shoplite-frontend:latest"

echo "Removing old application containers..."
docker rm -f frontend orders inventory catalog 2>/dev/null || true

echo "Starting Catalog..."
docker run -d \
  --name catalog \
  --network backend-net \
  -e DB_HOST=postgres \
  -e DB_PORT=5432 \
  -e DB_NAME=shopdb \
  -e DB_USER=shoplite_user \
  -e DB_PASSWORD=change_this_password \
  "$REGISTRY/shoplite-catalog:latest"

echo "Starting Inventory..."
docker run -d \
  --name inventory \
  --network backend-net \
  -e DATABASE_URL="postgres://shoplite_user:change_this_password@postgres:5432/shopdb?sslmode=disable" \
  "$REGISTRY/shoplite-inventory:latest"

echo "Starting Orders..."
docker run -d \
  --name orders \
  --network backend-net \
  -e DB_HOST=postgres \
  -e DB_PORT=5432 \
  -e DB_NAME=shopdb \
  -e DB_USER=shoplite_user \
  -e DB_PASSWORD=change_this_password \
  -e CATALOG_URL=http://catalog:3000 \
  -e INVENTORY_URL=http://inventory:8081 \
  "$REGISTRY/shoplite-orders:latest"

echo "Starting Frontend..."
docker run -d \
  --name frontend \
  --network backend-net \
  -p 80:80 \
  "$REGISTRY/shoplite-frontend:latest"

docker network connect frontend-net frontend

echo "ShopLite deployment completed!"
docker ps
