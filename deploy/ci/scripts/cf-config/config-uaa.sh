#!/usr/bin/env sh

uaac target https://uaa.cf-dev.io --skip-ssl-validation
uaac token client get admin -s admin_secret

# Create groups
uaac group add stratos.user
uaac group add stratos.admin
uaac group add stratos.publisher

# Create console client
uaac client add console --scope scim.me,openid,profile,roles,notification_preferences.read,user_attributes,uaa.user,notification_preferences.write,cloud_controller.read,password.write,approvals.me,cloud_controller.write,cloud_controller_service_permissions.read,stratos.admin,stratos.user,stratos.publisher,oauth.approvals --authorities clients.read,clients.write,clients.secret,uaa.admin,scim.read,scim.write,password.write,zone.admin,stratos.admin,stratos.user,stratos.publisher --access_token_validity 3600 --refresh_token_validity 2592000 --authorized_grant_types client_credentials,password,refresh_token -s test
uaac client get console
uaac user add -p hscuser --emails user user
uaac password set admin -p hscadmin
uaac member add stratos.admin admin
