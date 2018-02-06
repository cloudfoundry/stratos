#!/bin/sh
set -eu

echo "Running glide install on backend components"

# Support both v1 and v2

STRATOS_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../../"
#echo ${STRATOS_PATH}

if [ -d "${STRATOS_PATH}/components" ]; then
  echo "V1 Backend"
  BACKEND_PATHS=$(find ${STRATOS_PATH}/components -name backend)
else
  echo "V2 Backend"
  BACKEND_PATHS=$( find ${STRATOS_PATH}/src/backend -maxdepth 1 -mindepth 1 -type d)
fi

for backend in ${BACKEND_PATHS};
do
  NAME=`basename $backend`
  echo "Running Glide install for backend component: ${NAME}"
  cd $backend
  glide install
done
