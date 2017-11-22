#!/bin/bash

echo "Running e2e tests..."

cd deploy

cat << EOF > ../build/secrets.json
{
  "cloudFoundry": {
    "url": "${CF_LOCATION}",
    "admin": {
      "username": "${CF_ADMIN_USER}",
      "password": "${CF_ADMIN_PASSWORD}"
    },
    "user": {
      "username": "${CF_E2E_USER}",
      "password": "${CF_E2E_USER_PASSWORD}"
    }
  },
  "console": {
    "admin": {
      "username": "${CONSOLE_ADMIN_USER}",
      "password": "${CONSOLE_ADMIN_PASSWORD}"
    },
    "user": {
      "username": "${CONSOLE_USER_USER}",
      "password": "${CONSOLE_USER_PASSWORD}"
    }
  },
  "uaa": {
    "url": "http://uaa:8080",
    "clientId": "console",
    "adminUsername": "admin",
    "adminPassword": "hscadmin"
  }
}
EOF

docker version
echo ${DOCKER_REGISTRY}

# Pull down base images
for image in splatform/stratos-bk-base:opensuse splatform/stratos-nginx-base:opensuse splatform/stratos-uaa; do
  docker pull ${DOCKER_REGISTRY}/$image
  docker tag  ${DOCKER_REGISTRY}/$image $image
done

mkdir uaa/tmp
cp /tarballs/* ./uaa/tmp/

COMPOSE_HTTP_TIMEOUT=300 docker-compose -f docker-compose.test.yml build
COMPOSE_HTTP_TIMEOUT=300 docker-compose -f docker-compose.test.yml up -d
docker logs -f deploy_ui_1

CONTAINER_NAMES=$(docker ps --format "{{.Names}}")
mkdir e2e-output
for name in $CONTAINER_NAMES; do
    ID=$(docker ps --format "{{.ID}}" --filter name=$name)
    LOG_PATH=$(find /var/lib/docker/containers -name ${ID}\*.log)
    cp $LOG_PATH e2e-output/${name}.log
done
TIMESTAMP=$(date +%s)
tar -czf $TIMESTAMP.tar.gz e2e-output/*
#scp -i /id_rsa $TIMESTAMP.tar.gz ${SCP_LOCATION}
#echo "Download logs from: http://${WEB_SERVER_URI}/$TIMESTAMP.tar.gz"
sh ./ci/scripts/check_tests.sh
