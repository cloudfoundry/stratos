#!/bin/bash
set -eu

echo "Cleaning up docker-compose"
docker-compose -f docker-compose.development.yml down --rmi 'all'
docker rmi -f console-proxy-builder
docker ps -a
echo "Done!"
