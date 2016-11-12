#!/bin/bash

DIRPATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source ${DIRPATH}/build_common.sh

mkdir images
cd images
images=( stackatotest/hsc-concourse:latest stackatotest/goose debian:jessie postgres:latest  nginx )
for image in "${images[@]}"; do
 echo Downloading image "$image"
 docker pull $image
 echo Saving image
 docker save $image -o ${image##*/}
done
cd ..

echo FROM amidos/dcind:latest > Dockerfile.dcind

for image in $(ls images/); do
  echo COPY images/$image /docker-images/$image >> Dockerfile.dcind
done

docker build -f Dockerfile.dcind ./ -t stackatotest/hsc-dcind:${TAG} ${BUILD_ARGS}
rm -rf images
rm -f Dockerfile.dcind
