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
PORTAL_PROXY_PATH=${__DIRNAME}/../../portal-proxy
pushd ${PORTAL_PROXY_PATH}
./tools/build_portal_proxy.sh
popd

buildAndPublishImage cnap-console-proxy server.Dockerfile ${__DIRNAME}/../../portal-proxy

# Prepare the nginx server
pushd ../stratos-ui/tools
npm install
bower install
npm run build

cd ..
cp -R ./dist ../stratos-server/dist
popd

buildAndPublishImage cnap-console-server Dockerfile.prod ../stratos-server
