#!/bin/bash

echo "Configuring UAA for SSO"

if [ -z "${UAA_ENDPOINT}" ]; then
  echo "UAA_ENDPOINT environment variable not set"
  exit 1
fi

ZONE_ARG=""
if [ -n "${UAA_ZONE}" ]; then
  echo "UAA ZONE: ${UAA_ZONE}"
  ZONE_ARG="-z ${UAA_ZONE}"
fi

echo "Using UAA Endpoint: ${UAA_ENDPOINT}"
uaac target ${UAA_ENDPOINT} --skip-ssl-validation
uaac token client get admin -s ${ADMIN_CLIENT_SECRET}

uaac client get cf ${ZONE_ARG}
uaac client update cf --redirect_uri=https://console.${CF_DOMAIN}/pp/v1/auth/sso_login_callback ${ZONE_ARG}
uaac client update cf --authorized_grant_types password,refresh_token,authorization_code ${ZONE_ARG}

echo "UAA SSO Configuration complete"