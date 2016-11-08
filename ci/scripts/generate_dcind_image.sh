#!/bin/bash

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

docker build -f Dockerfile.dcind ./ -t stackatotest/hsc-dcind:latest --build-arg http_proxy=${http_proxy} --build-arg https_proxy=${https_proxy}
rm -rf images
rm -f Dockerfile.dcind
