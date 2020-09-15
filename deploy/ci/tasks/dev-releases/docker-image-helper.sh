#!/bin/bash

# Get commit label for a docker image

function dockerMakeCurl() {
  local URL=$1
  local MANIFEST=$2

  if [ "$MANIFEST" == "true" ]; then

    if [ "$TOKEN" != "" ]; then
      curl --location -s -H "Accept: application/vnd.docker.distribution.manifest.v2+json" -H "Authorization: Bearer $TOKEN" $URL
    else
      curl --location -s -H "Accept: application/vnd.docker.distribution.manifest.v2+json" $USER_AUTH $URL
    fi
  else
    if [ "$TOKEN" != "" ]; then
      curl --location -s -H "Authorization: Bearer $TOKEN"  $URL
    else
      curl --location -s $USER_AUTH $URL
    fi
  fi
}

function getDockerImageCommitLabel() {

  local REG=$1
  local USER=$2
  local PASS=$3
  local ORG=$4
  local IMAGE=$5
  local TAG=$6

  local USER_AUTH=""

  if [ "$REG" == "docker.io" ]; then
    TOKEN=`curl -s "https://auth.docker.io/token?service=registry.docker.io&scope=repository:$ORG/$IMAGE:pull" | jq -r .token`
    AUTH_TYPE="Bearer"
    REGISTRY_ADDRESS=https://registry.hub.docker.com
  else
    USER_AUTH="-u $USER:$PASS"
    REGISTRY_ADDRESS=https://$REG
    TOKEN=""
  fi

  local URL="$REGISTRY_ADDRESS/v2/$ORG/$IMAGE/manifests/$TAG"

  DIGEST=`dockerMakeCurl $URL "true" | jq -r '.config.digest'`
  
  COMMIT=`dockerMakeCurl "$REGISTRY_ADDRESS/v2/$ORG/$IMAGE/blobs/$DIGEST" "false" | jq -r .container_config.Labels["com.stratos.commit"]`
  echo "$COMMIT"
}
