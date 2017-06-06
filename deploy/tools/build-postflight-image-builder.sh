#!/usr/bin/env bash

DIR_NAME=$(mktemp -d)
DOCKER_ORGANISATION=susetest
IMAGE_NAME=hsc-postflight-builder
TAG=latest

while getopts ":ho:t:p" opt ; do
    case $opt in
        o)
            DOCKER_ORGANISATION=true
            ;;
        t)
            TAG=true
            ;;
        p)
            PUSH_IMAGE=true
            ;;
        h)
            usage
            ;;
        \?)
            echo "Invalid option -$OPTARG" >&2
            usage
            ;;
    esac
done

PROG=$(basename ${BASH_SOURCE[0]})

function usage {
    echo "usage: $PROG [-o] [-t] [-p]"
    echo "       -o    Organisation to push image to"
    echo "       -t    Tag of the image"
    echo "       -p    Push image"
    exit 1
}

# Write out script to build goose

ENTRYPOINT_SCRIPT=${DIR_NAME}/build-goose.sh
cat << EOT >> ${ENTRYPOINT_SCRIPT}
#!/usr/bin/env sh

apk update
apk add git gcc musl-dev
go get 'bitbucket.org/liamstask/goose/cmd/goose'
EOT

chmod +x ${DIR_NAME}/build-goose.sh

# Write out Dockerfile
DOCKERFILE=${DIR_NAME}/Dockerfile
cat << EOT >> ${DOCKERFILE}
FROM golang:alpine

ADD build-goose.sh /build-goose.sh
CMD ["/build-goose.sh"]
EOT

cd ${DIR_NAME}
echo "Building image  ${DOCKER_ORGANISATION}/${IMAGE_NAME}:${TAG}"
docker build . -t ${DOCKER_ORGANISATION}/${IMAGE_NAME}:${TAG}

if [ -n "${PUSH_IMAGE}" ]; then
    echo "Pushing image  ${DOCKER_ORGANISATION}/${IMAGE_NAME}:${TAG}"
    docker push ${DOCKER_ORGANISATION}/${IMAGE_NAME}:${TAG}
fi