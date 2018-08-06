#!/bin/bash

UAAC_CLI="uaac.ruby2.5"
CF_CLI="cf"
CF_API_ENDPOINT="https://api.local.pcfdev.io:443"
UAA_ENDPOINT="https://uaa.local.pcfdev.io:443"
UAA_CLIENT="admin"
UAA_ADMIN_CLIENT_SECRET="admin-client-secret"

function checkCode{
  local CODE=$1
  local MSG=$2
  if [ ! $? -eq 0 ]; then
    echo ${MSG}
    exit 1
  fi
}


function loginToCF{
  
}
function createUser{
  ret = $({CF_CLI} create-user ${CF_ADMIN_USER} ${CF_ADMIN_PASSWORD})
  checkCode $? "Failed to create user"
}

function deleteUser{
  ret = $({UAAC_CLI} target --skip-ssl-validation ${UAA_ENDPOINT})
  checkCode $? "Failed to create user"
  ret = $({UAAC_CLI} create-user ${CF_ADMIN_USER} ${CF_ADMIN_PASSWORD})
  checkCode $? "Failed to create user"
}