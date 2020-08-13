#!/bin/bash

# Ensures we have the helm repos that we need for tests
echo "========================="
echo "Add Helm Repos"
echo "========================="

DIRPATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STRATOS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd ../../.. && pwd)"

CYAN="\033[96m"
YELLOW="\033[93m"
RESET="\033[0m"
BOLD="\033[1m"

REPOS=$1
if [ -z ${REPOS} ]; then
  echo "Need list of helm repos to add"
  exit 1
fi

set -e

function inspectImage {
  local IMAGE=$1
  echo ""
  echo -e "${YELLOW}${BOLD}Image: ${IMAGE}${RESET}"
  docker pull ${IMAGE} >& /dev/null
  INFO=$(docker images ${IMAGE})
  echo -e "${CYAN}${INFO}${RESET}"

  # Check OS
  OS=$(docker run -t --entrypoint="/bin/bash" ${IMAGE} -c "cat /etc/os-release | grep PRETTY_NAME")
  echo -e "${CYAN}${OS:12}${RESET}"
}

function processRepository {

  # Split the Repo on the = sign
  NAME="$(cut -d'=' -f1 <<<"$1")"
  URL="$(cut -d'=' -f2 <<<"$1")"

  COUNT=$(helm repo list | grep -c '^'"$NAME"'[[:space:]]' || true)
  if [ "$COUNT" == "0" ]; then
    echo "Helm repository $NAME does not exist - adding"
    helm repo add $NAME $URL
  else
    echo "Helm repository $NAME already exists"
    COUNT=$(helm repo list | grep -c '^'"$NAME"'[[:space:]]*'"$URL"'' || true)
    if [ "$COUNT" == "0" ]; then
      echo "The repository name $NAME does not reference the expected URL $URL"
      echo "Removing existing helm repository with name $NAME"
      helm repo remove $NAME
      helm repo add $NAME $URL
    fi
  fi
 
}

Field_Separator=$IFS
IFS=,
for REPO in ${REPOS};
do
  processRepository $REPO
done
IFS=$Field_Separator

helm repo update