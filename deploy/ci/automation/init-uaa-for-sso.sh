#!/bin/bash

echo "Configuring UAA for SSO"

CF=https://api.${CF_DOMAIN}
UAA=$(curl -k -s $CF | jq -r .links.uaa.href)
echo "Using UAA Endpoint: ${UAA}"

uaac target ${UAA} --skip-ssl-validation
uaac token client get admin -s ${ADMIN_CLIENT_SECRET}

uaac client update cf --redirect_uri=https://console.${CF_DOMAIN}/pp/v1/auth/sso_login_callback
uaac client update cf --authorized_grant_types password,refresh_token,authorization_code

echo "UAA SSO Configuration complete"