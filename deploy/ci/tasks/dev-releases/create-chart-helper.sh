#!/bin/bash

patchHelmChart () {
  local TAG=$1
  local DOCKER_ORG=$2
  local DOCKER_REG=$3
  local CHART_PATH=$4
  sed -i -e 's/consoleVersion: latest/consoleVersion: '"${TAG}"'/g' ${CHART_PATH}/values.yaml
  sed -i -e 's/organization: splatform/organization: '"${DOCKER_ORG}"'/g' ${CHART_PATH}/values.yaml
  sed -i -e 's/hostname: docker.io/hostname: '"${DOCKER_REG}"'/g' ${CHART_PATH}/values.yaml

  sed -i -e 's/version: 0.1.0/version: '"${TAG}"'/g' ${CHART_PATH}/Chart.yaml  
}

setupAndPushChange() {
  git config --global user.name ${GIT_USER}
  git config --global user.email ${GIT_EMAIL}

  mkdir -p /root/.ssh/
  echo "${GIT_PRIVATE_KEY}" > /root/.ssh/id_rsa
  chmod 600 /root/.ssh/id_rsa
  git stash
  git pull --rebase
  git stash pop
  echo -e "Host github.com\n\tStrictHostKeyChecking no\n" >> ~/.ssh/config
  git add index.yaml
  git commit -m "Dev releases Helm repository updated for tag: ${IMAGE_TAG}"
  git config --global push.default simple
  git push origin HEAD:master

}

fetchImageTag() {
  echo "$(cat ${STRATOS}/deploy/ci/tasks/dev-releases/nightly-tag)-$(git rev-parse HEAD | head -c 8)"
}

nightlyTag() {
  echo "$(cat ${STRATOS}/deploy/ci/tasks/dev-releases/nightly-tag)"
}