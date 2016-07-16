#
set -eux

DOCKER_REGISTRY=docker-registry.helion.space:443
GROUP_NAME=hsc
NAME=console-proxy-builder
TAG=latest

PORTAL_PROXY_PATH=$GOPATH/src/github.com/hpcloud/portal-proxy

pushd ${PORTAL_PROXY_PATH}
pushd $(git rev-parse --show-toplevel)

IMAGE_URL=${DOCKER_REGISTRY}/${GROUP_NAME}/${NAME}:${TAG}
echo Building Docker Image for $NAME

# Build the image
docker build --tag console-proxy-builder \
             --file Dockerfile.build \
             .

# Tag the new image
echo Tagging the new image
docker tag ${NAME} ${IMAGE_URL}

# Push it to the shared private registry
echo Pushing Docker Image ${IMAGE_URL}
docker push ${IMAGE_URL}

popd
popd
