#!/usr/bin/env bash
set -eu

# set defaults
DOCKER_REGISTRY=docker.io
DOCKER_ORG=splatform

NO_PUSH="false"

while getopts ":o:r:n" opt; do
  case $opt in
     r)
      DOCKER_REGISTRY="${OPTARG}"
      ;;
    o)
      DOCKER_ORG="${OPTARG}"
      ;;
 
    n)
      NO_PUSH="true"
      ;;
    \?)
      echo "Invalid option: -${OPTARG}" >&2
      exit 1
      ;;
    :)
      echo "Option -$OPTARG requires an argument." >&2
      exit 1
      ;;
  esac
done

DOCKER_REGISTRY=${DOCKER_REGISTRY:-docker.io}
DOCKER_ORG=${DOCKER_ORG:-splatform}

echo
echo "=============================================================================="
echo "Stratos: Backend Builder: Image Creator"
echo "=============================================================================="
echo

if [ "${NO_PUSH}" != "false" ]; then
  echo "Images will NOT be pushed"
else
  echo "Images will be pushed"
  echo "  REGISTRY: ${DOCKER_REGISTRY}"
  echo "  ORG: ${DOCKER_ORG}"
fi
NAME=stratos-jetstream-builder
TAG=${TAG:-opensuse}
BK_BUILD_BASE=${BK_BUILD_BASE:-splatform/stratos-bk-build-base:opensuse}

STRATOS_UI_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../../"

pushd ${STRATOS_UI_PATH}
pushd $(git rev-parse --show-toplevel)

SHARED_IMAGE_URL=${DOCKER_REGISTRY}/${DOCKER_ORG}/${NAME}:${TAG}

echo "Building Docker Image for $NAME"
pushd deploy

# Generate Glide cache
docker run \
       -ti \
       --rm \
       -e GLIDE_HOME=/.glide \
       -e HOME=/stratos-ui \
       --volume ${PWD}/glide-cache:/.glide \
       --volume $PWD/../:/stratos-ui \
       ${BK_BUILD_BASE} \
       sh /stratos-ui/deploy/tools/glide_install_cache.sh

# Generate NPM cache
docker run \
       -ti \
       --rm \
       --volume ${PWD}/npm-cache:/root/.npm \
       --volume $PWD/..:/stratos-ui \
       ${BK_BUILD_BASE} \
       bash  -c "cd /stratos-ui && npm install"

# Patch bk-build-base
sed -i.bak "s@splatform/stratos-bk-build-base:opensuse@${BK_BUILD_BASE}@g" Dockerfile.bk.build
docker build --tag ${NAME} \
             --file Dockerfile.bk.build .

sudo rm -rf ./glide-cache
sudo rm -rf ./npm-cache
rm -rf ../run-glide.sh
rm -rf ../vendor/

# Unpatch BK Build Base
rm Dockerfile.bk.build
mv Dockerfile.bk.build.bak Dockerfile.bk.build

popd

echo "Tag ${SHARED_IMAGE_URL} and push the shared image"
docker tag ${NAME} ${SHARED_IMAGE_URL}
if [ "${NO_PUSH}" = "false" ]; then
  echo "Pushing docker image: ${SHARED_IMAGE_URL}"
  docker push ${SHARED_IMAGE_URL}
fi
