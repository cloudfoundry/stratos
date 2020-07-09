function buildAndPublishImage {
  NAME=${1}
  DOCKER_FILE=${2}
  FOLDER=${3}
  TARGET=${4:-none}

  if [ ! -d "${FOLDER}" ]; then
    echo "Project ${FOLDER} hasn't been checked out";
    exit 1
  fi

  IMAGE_URL=${DOCKER_REGISTRY}/${DOCKER_ORG}/${NAME}:${TAG}
  echo Building Docker Image for ${NAME}

  pushd "${FOLDER}" > /dev/null 2>&1
  pwd

  SET_TARGET=""
  if [ "${TARGET}" != "none" ]; then
    SET_TARGET="--target=${TARGET}"
  fi

  docker build ${BUILD_ARGS} ${SET_TARGET} -t $NAME -f $DOCKER_FILE .
  docker tag ${NAME} ${IMAGE_URL}

  if [ "${NO_PUSH}" = "false" ]; then
    echo Pushing Docker Image ${IMAGE_URL}
    docker push  ${IMAGE_URL}
  fi

  if [ "${TAG_LATEST}" = "true" ]; then
    docker tag ${IMAGE_URL} ${DOCKER_REGISTRY}/${DOCKER_ORG}/${NAME}:latest
    if [ "${NO_PUSH}" = "false" ]; then
      echo Pushing Docker Image ${DOCKER_REGISTRY}/${DOCKER_ORG}/${NAME}:latest
      docker push ${DOCKER_REGISTRY}/${DOCKER_ORG}/${NAME}:latest
    fi
  fi

  # Update values.yaml

  popd > /dev/null 2>&1
}

# Proxy support
# Remove intermediate containers after a successful build
BUILD_ARGS="--rm=true"
RUN_ARGS=""
if [ -n "${http_proxy:-}" -o -n "${HTTP_PROXY:-}" ]; then
  BUILD_ARGS="${BUILD_ARGS} --build-arg http_proxy=${http_proxy:-${HTTP_PROXY}}"
  RUN_ARGS="${RUN_ARGS} -e http_proxy=${http_proxy:-${HTTP_PROXY}}"
fi
if [ -n "${https_proxy:-}" -o -n "${HTTPS_PROXY:-}" ]; then
  BUILD_ARGS="${BUILD_ARGS} --build-arg https_proxy=${https_proxy:-${HTTPS_PROXY}}"
  RUN_ARGS="${RUN_ARGS} -e https_proxy=${https_proxy:-${HTTPS_PROXY}}"
fi

# Check if we can squash
CAN_SQUASH=$(docker info 2>&1 | grep "Experimental: true" -c | cat)
if [ "${CAN_SQUASH}" == "1" ]; then
  BUILD_ARGS="${BUILD_ARGS} --squash"
  echo "Images will be squashed"
else
  echo "Images will NOT be squashed"
fi

# Use correct sed command for Mac
SED="sed -r"
unamestr=`uname`
if [[ "$unamestr" == 'Darwin' ]]; then
   SED="sed -E"
fi   

# Trim leading/trailing whitespace
BUILD_ARGS="$(echo -e "${BUILD_ARGS}" | $SED -e 's@^[[:space:]]*@@' -e 's@[[:space:]]*$@@')"
RUN_ARGS="$(echo -e "${RUN_ARGS}" | $SED -e 's@^[[:space:]]*@@' -e 's@[[:space:]]*$@@')"

if [ -n "${BUILD_ARGS}" ]; then
  echo "Web Proxy detected from environment. Running Docker with:"
  echo -e "- BUILD_ARGS:\t'${BUILD_ARGS}'"
  echo -e "- RUN_ARGS:\t'${RUN_ARGS}'"
fi

# Grab and store the git metadata so we can report in this in the UI Diagnostics
"${STRATOS_PATH}/build/store-git-metadata.sh"

function updateTagForRelease {
  # Reset the TAG variable for a release to be of the form:
  #   <version>-<commit#>-<prefix><hash>
  #   where:
  #     <version> = semantic, in the form major#.minor#.patch#
  #     <commit#> = number of commits since tag - always 0
  #     <prefix> = git commit prefix - always 'g'
  #     <hash> = git commit hash for the current branch
  # Reference: See the examples section here -> https://git-scm.com/docs/git-describe
  pushd "${STRATOS_PATH}" > /dev/null 2>&1
  GIT_HASH=$(git rev-parse --short HEAD)
  echo "GIT_HASH: ${GIT_HASH}"
  TAG="${TAG}-g${GIT_HASH}"
  if [ "${ADD_OFFICIAL_TAG}" = "true" ]; then
  TAG=${OFFICIAL_TAG}-${TAG}
  fi
  echo "New TAG: ${TAG}"
  popd > /dev/null 2>&1
}

function cleanup {
  # Cleanup the SDL/instance defs
  echo
  echo "-- Cleaning up older values.yaml"
  rm -f values.yaml
  # Cleanup prior to generating the UI container
  echo
  echo "-- Cleaning up ${STRATOS_PATH}"
  rm -rf ${STRATOS_PATH}/dist
  rm -rf ${STRATOS_PATH}/node_modules
  echo
  echo "-- Cleaning up ${STRATOS_PATH}/deploy/containers/nginx/dist"
  rm -rf ${STRATOS_PATH}/deploy/containers/nginx/dist
}