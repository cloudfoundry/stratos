#! /bin/bash
set -e

DOCKER_REGISTRY=docker-registry.helion.space:443
#DOCKER_REGISTRY=localhost:5000
TAG=latest
GROUP_NAME=helioncf
BUILD_ARGS=""
__DIRNAME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"


#BUILD_ARGS="--build-arg http_proxy=http://proxy.sdc.hp.com:8080"
#BUILD_ARGS="$BUILD_ARGS --build-arg https_proxy=http://proxy.sdc.hp.com:8080"


function buildAndPublishImage {
  # $1 is name
  # $2 is docker file name
  # $3 is folder name

  NAME=$1
  DOCKER_FILE=$2
  FOLDER=$3

  if [ ! -d "${FOLDER}" ]; then
    echo "Project ${FOLDER} hasn't been checked out";
    exit 1
  fi

  IMAGE_URL=${DOCKER_REGISTRY}/${GROUP_NAME}/${NAME}:${TAG}
  echo Building Docker Image for $NAME

  pushd ${FOLDER}
  pwd
  docker build ${BUILD_ARGS} -t $NAME -f $DOCKER_FILE .

  docker tag ${NAME} ${IMAGE_URL}

  echo Pushing Docker Image ${IMAGE_URL}}
  docker push  ${IMAGE_URL}
  popd
}

# Build and publish all of the images for Stratos Console UI
buildAndPublishImage cnap-console-db Dockerfile.UCP  ${__DIRNAME}/../../stratos-identity-db
buildAndPublishImage cnap-console-mock-api Dockerfile.mock_api.UCP ${__DIRNAME}/../../stratos-node-server
buildAndPublishImage cnap-console-mock-auth Dockerfile.mock_auth.UCP ${__DIRNAME}/../../stratos-node-server
buildAndPublishImage cnap-console-api Dockerfile.UCP ${__DIRNAME}/../../stratos-node-server

# Build Portal Proxy
PORTAL_PROXY_PATH=$GOPATH/src/github.com/hpcloud/portal-proxy
pushd ${PORTAL_PROXY_PATH}
./tools/build_portal_proxy.sh
popd

# Build and publish the container image for the portal proxy
buildAndPublishImage cnap-console-proxy server.Dockerfile ${PORTAL_PROXY_PATH}

# Prepare the nginx server
docker run --rm \
  -v ${__DIRNAME}/../../stratos-ui:/usr/src/app \
  -v ${__DIRNAME}/../../helion-ui-framework:/usr/src/helion-ui-framework \
  -v ${__DIRNAME}/../../helion-ui-theme:/usr/src/helion-ui-theme \
  -w /usr/src/app \
  node:4.2.3 \
  /bin/bash ./provision.sh

# Copy the artifacts from the above to the stratos-server
cp -R ${__DIRNAME}/../../stratos-ui/dist ${__DIRNAME}/../../stratos-server/dist

# Build and push an image based on stratos-server
buildAndPublishImage cnap-console-server Dockerfile.UCP ${__DIRNAME}/../../stratos-server
