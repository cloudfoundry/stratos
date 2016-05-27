#!/bin/bash
echo "Cleaning up docker-compose"
docker-compose stop && docker-compose rm -f
docker stop stratosdeploy_proxy_1 && docker rm stratosdeploy_proxy_1
docker stop stratosdeploy_postgres_1 && docker rm stratosdeploy_postgres_1
docker ps -a
echo "Done!"
