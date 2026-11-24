#!/bin/bash

set -e

echo "Starting ShopLite..."

echo "Starting PostgreSQL..."
docker start postgres

sleep 5

echo "Starting Catalog service..."
docker start catalog

echo "Starting Inventory service..."
docker start inventory

sleep 3

echo "Starting Orders service..."
docker start orders

echo "Starting Frontend..."
docker start frontend

echo "ShopLite started successfully!"
docker ps
