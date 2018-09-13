#!/bin/bash

uaac target https://login.uaa.pcfdev.io
uaac token client get admin -s admin-client-secret

uaac client update cf --redirect_uri=https://console.local.pcfdev.io/pp/v1/auth/sso_login_callback
uaac client update cf --authorized_grant_types password,refresh_token,authorization_code
