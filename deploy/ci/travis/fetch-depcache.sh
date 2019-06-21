#!/bin/bash
set -e

# Download the go vendor folder if configured
DIRPATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd ../../.. && pwd)"
GODEPCACHEURL=${STRATOS_GODEP_CACHE:false}
BACKEND_PATH="${DIRPATH}/src/jetstream"

unamestr=`uname`

if [ "${GODEPCACHEURL}" != "false" ]; then
  pushd "$BACKEND_PATH" > /dev/null
  if [ "$unamestr" == "Darwin" ]; then
    CACHEMD5=$(cat go.mod go.sum | md5 -q)
  else
    CACHEMD5=$(cat go.mod go.sum | md5sum | awk '{ print $1 }')
  fi
  popd > /dev/null
  DEPFILE="go-vendor-${CACHEMD5}.tgz"
  echo "Looking for vendor cache file : $DEPFILE"
  set +e

  echo "${GODEPCACHEURL}/${DEPFILE}"
  curl -L -s -f "${GODEPCACHEURL}/${DEPFILE}" -o depcache.tgz
  if [ $? -eq 0 ]; then
    echo "Unpacking depcache"
    tar -xvf depcache.tgz -C "${BACKEND_PATH}" > /dev/null
  else
    echo "Could not find vendor cache to download"
  fi
  set -e
fi

