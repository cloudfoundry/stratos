#!/bin/bash

DIRPATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_REGISTRY=${DOCKER_REGISTRY:-docker.io}
DOCKER_ORG=${DOCKER_ORG:-splatform}
TAG=${TAG:-test}

source ${DIRPATH}/build_common.sh

# Initialise Glide cache

cd ${DIRPATH}/../../../
cat << EOF >> init-glide.sh
#!/bin/bash
cd /root
glide_yamls=$(find ./components -name glide.yaml)
for yaml in ${glide_yamls}; do 
ls -l ${yaml}
glide --yaml ${yaml} install;
done
EOF
chmod +x init-glide.sh
# ci-registry.ngrok.io:80/concourse-go-glide is fabiorphp/golang-glide:latest
mkdir cache
ls  -l $PWD
whoami
docker run -v ${PWD}/:/root -v ${PWD}/cache:/.glide/cache -e GLIDE_HOME=/.glide ci-registry.ngrok.io:80/concourse-go-glide  /root/init-glide.sh

docker build  -f deploy/ci/Dockerfile.bk.concourse ./ -t ${DOCKER_REGISTRY}/${DOCKER_ORG}/stratos-bk-concourse:${TAG} \
    ${BUILD_ARGS}
