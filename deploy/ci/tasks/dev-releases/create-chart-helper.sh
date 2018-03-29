#!/bin/bash

patchHelmChart () {
  TAG=$1
  DOCKER_ORG=$2
  DOCKER_REG=$3
  CHART_PATH=$4
  sed -i -e 's/consoleVersion: latest/consoleVersion: '"${TAG}"'/g' ${CHART_PATH}/values.yaml
  sed -i -e 's/organization: splatform/organization: '"${DOCKER_ORG}"'/g' ${CHART_PATH}/values.yaml
  sed -i -e 's/hostname: docker.io/hostname: '"${DOCKER_REG}"'/g' ${CHART_PATH}/values.yaml

  sed -i -e 's/version: 0.1.0/version: '2.0.0-"${TAG}"'/g' ${CHART_PATH}/Chart.yaml  
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
  git add dev/index.yaml
  git commit -m "Dev releases Helm repository updated for tag: ${TAG}"
  git config --global push.default simple
  git push origin HEAD:master

}