#!/bin/bash
set -eu

echo "Cleaning up docker-compose"
docker-compose -f docker-compose.development.yml down --rmi 'all'
docker ps -a
echo "Done!"
