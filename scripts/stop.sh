#!/bin/bash

set -e

echo "Stopping ShopLite..."

echo "Stopping Frontend..."
docker stop frontend

echo "Stopping Orders service..."
docker stop orders

echo "Stopping Inventory service..."
docker stop inventory

echo "Stopping Catalog service..."
docker stop catalog

echo "Stopping PostgreSQL..."
docker stop postgres

echo "ShopLite stopped successfully!"
