
pushd stratos

VERSION=$(cat package.json | grep version | grep -Po "([0-9\.]?)*")
COMMIT_HASH=$(git log -1 --format="%h")
LATEST_TAG=$VERSION-${COMMIT_HASH}
SOURCE_CODE_REPO=$(git config --get remote.origin.url)

# Nightly build - use the specified release tag
if [ -n "${NIGHTLY_BUILD}" ]; then
  RELEASE_TAG=${NIGHTLY_BUILD}
else
  # Check that the RELEASE_TAG matches the version
  RELEASE_TAG=$(git describe)
  if [[ "${RELEASE_TAG}" != ${VERSION}* ]]; then
    echo "Error: Can not get tag for this release - got ${RELEASE_TAG}"
    exit 1
  fi
fi

if [ ! -z ${TAG_SUFFIX} ]; then
  if [ "${TAG_SUFFIX}" != "null" ]; then
    echo "Adding tag suffix '$TAG_SUFFIX' to the latest tag."
    LATEST_TAG=${LATEST_TAG}-${TAG_SUFFIX}
    echo "The latest tag is now $LATEST_TAG."
  fi
fi

popd

set +x
echo "VERSION : ${VERSION}"
echo "COMMIT_HASH : ${COMMIT_HASH}"
echo "LATEST_TAG : ${LATEST_TAG}"
echo "SOURCE_CODE_REPO : ${SOURCE_CODE_REPO}"
echo "RELEASE_TAG : ${RELEASE_TAG}"
set -x
