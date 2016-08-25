#
set -eux

DOCKER_REGISTRY=docker-registry.helion.space:443
GROUP_NAME=hsc
NAME=console-etcd2-base
TAG=latest

pushd $GOPATH/src/github.com/hpcloud/portal-proxy
pushd $(git rev-parse --show-toplevel)
pushd containers/etcd

SHARED_IMAGE_URL=${DOCKER_REGISTRY}/${GROUP_NAME}/${NAME}:${TAG}

echo "Building Docker Image for $NAME"
docker build --tag ${NAME} \
             --file Dockerfile.HCP \
             .

echo "Tag and push the shared image"
docker tag ${NAME} ${SHARED_IMAGE_URL}
docker push ${SHARED_IMAGE_URL}

popd
popd
popd
