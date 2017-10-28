#!/usr/bin/env bash
set -eux

DOCKER_REGISTRY=${DOCKER_REGISTRY:-registry.capbristol.com:5000}
DOCKER_ORG=${DOCKER_ORG:-splatform}
NAME=stratos-proxy-builder
TAG=${TAG:-opensuse}
BK_BUILD_BASE=${BK_BUILD_BASE:-splatform/stratos-bk-build-base:opensuse}

STRATOS_UI_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../../"

pushd ${STRATOS_UI_PATH}
pushd $(git rev-parse --show-toplevel)

SHARED_IMAGE_URL=${DOCKER_REGISTRY}/${DOCKER_ORG}/${NAME}:${TAG}

echo "Building Docker Image for $NAME"
pushd deploy

# Generate Glide cache
cat << EOT > ../run-glide.sh
#!/bin/sh
BACKEND_PATHS=\$(find /stratos-ui/components -name backend)
for backend in \${BACKEND_PATHS};
do
    cd \$backend
    glide install;
done
EOT
chmod +x ../run-glide.sh

docker run \
       -ti \
       --rm \
       -e GLIDE_HOME=/.glide \
       -e HOME=/stratos-ui \
       --volume ${PWD}/glide-cache:/.glide \
       --volume $PWD/../:/stratos-ui \
       ${BK_BUILD_BASE} \
       sh /stratos-ui/run-glide.sh

# Generate NPM cache
docker run \
       -ti \
       --rm \
       --volume ${PWD}/npm-cache:/root/.npm \
       --volume $PWD/..:/stratos-ui \
       ${BK_BUILD_BASE} \
       bash  -c "cd /stratos-ui && npm install"

# Patch bk-build-base
sed -i "s@splatform/stratos-bk-build-base:opensuse@${BK_BUILD_BASE}@g" Dockerfile.bk.build
docker build --tag ${NAME} \
             --file Dockerfile.bk.build .

sudo rm -rf ./glide-cache
sudo rm -rf ./npm-cache
rm -rf ../run-glide.sh
rm -rf ../vendor/
# Unpatch BK Build Base
sed -i "s@${BK_BUILD_BASE}@splatform/stratos-bk-build-base:opensuse@g" Dockerfile.bk.build
popd

echo "Tag ${SHARED_IMAGE_URL} and push the shared image"
docker tag ${NAME} ${SHARED_IMAGE_URL}
docker push ${SHARED_IMAGE_URL}
