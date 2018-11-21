#!/bin/bash

__DIRNAME="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

export FISSILE_RELEASE="${__DIRNAME}/../stratos-ui-release"
export FISSILE_ROLE_MANIFEST="role-manifest.yml"
export FISSILE_LIGHT_OPINIONS="opinions.yml"
export FISSILE_DARK_OPINIONS="dark-opinions.yml"
export FISSILE_WORK_DIR="${__DIRNAME}/../../output/fissile"
export FISSILE_STEMCELL="splatform/fissile-stemcell-opensuse:42.2-6.ga651b2d-28.33" 


rm -rf fissile-console*

docker pull ${FISSILE_STEMCELL}

# Build release
pushd ${__DIRNAME}/../../
docker run --rm \
--volume "${HOME}/.bosh/cache:/bosh-cache" \
--volume "${PWD}:${PWD}" \
--env "RUBY_VERSION=2.2.3" \
splatform/bosh-cli-fissile \
/usr/local/bin/create-release.sh \
    "$(id -u)" "$(id -g)" /bosh-cache --dir "${PWD}/deploy/stratos-ui-release" --force --name "stratos-ui"
popd

# Compile packages from the nats release
fissile build packages

# Build the nats docker image
fissile build images

# Build Helm chart
fissile build helm --defaults-file=defaults.txt

mkdir fissile-console
mv templates/ fissile-console/
mv values.yaml fissile-console/
cat << EOF >> fissile-console/Chart.yaml
apiVersion: v1
description: A Helm chart for deploying Console
name: fissile-console
version: 0.1.0
EOF

# Push images
pushd fissile-console/templates
backend_image=$(cat backend.yaml  | grep image | sed 's/.*\(fissile-backend.*\)/\1/g')
docker tag ${backend_image} splatform/${backend_image}
docker push splatform/${backend_image}
sed -i 's@fissile-backend@splatform/fissile-backend@g' backend.yaml 

frontend_image=$(cat frontend.yaml  | grep image | sed 's/.*\(fissile-frontend.*\)/\1/g')
docker tag ${frontend_image} splatform/${frontend_image}
docker push splatform/${frontend_image}
sed -i 's@fissile-frontend@splatform/fissile-frontend@g' frontend.yaml 


# Change memory
sed -i 's@memory: 1Gi@memory: 100Mi@g' *.yaml
popd

pushd fissile-console
KUBE_EXTERNAL_IP=${KUBE_EXTERNAL_IP:-"127.0.0.1"}
sed -i 's@192.168.77.77@'${KUBE_EXTERNAL_IP}'@g' values.yaml
sed -i 's@persistent: persistent@persistent: standard@g' values.yaml
sed -i 's@FISSILE_MONIT_PASSWORD: ~@FISSILE_MONIT_PASSWORD: monit@g' values.yaml
sed -i 's@FISSILE_MONIT_PORT: ~@FISSILE_MONIT_PORT: 2812@g' values.yaml
sed -i 's@FISSILE_MONIT_USER: ~@FISSILE_MONIT_USER: admin@g' values.yaml
popd


