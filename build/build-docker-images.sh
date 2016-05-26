#! /bin/bash
set -e

DOCKER_REGISTRY=docker-registry.helion.space:443
TAG=latest
GROUP_NAME=helioncf
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
buildAndPublishImage cnap-console-db Dockerfile.UCP  ../stratos-identity-db
buildAndPublishImage cnap-console-mock-api Dockerfile.mock_api.UCP ../stratos-node-server
buildAndPublishImage cnap-console-mock-auth Dockerfile.mock_auth.UCP ../stratos-node-server
buildAndPublishImage cnap-console-api Dockerfile.UCP ../stratos-node-server
buildAndPublishImage cnap-console-proxy server.Dockerfile ../portal-proxy

# Prepare the nginx server
pushd ../stratos-ui/tools
npm install
bower install
npm run build

cd ..
cp -R ./dist ../stratos-server/dist
popd

buildAndPublishImage cnap-console-server Dockerfile.prod ../stratos-server
