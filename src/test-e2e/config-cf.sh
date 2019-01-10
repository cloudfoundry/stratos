#!/usr/bin/env sh

#cf api --skip-ssl-validation https://api.cf-dev.io
#cf login -u admin -p changeme

# E2E settings
cf create-org e2e
cf target -o "e2e"
cf create-space "e2e"
cf target -s "e2e"
cf create-user e2e changeme
cf set-space-role e2e e2e e2e SpaceDeveloper

cf create-org SUSE
cf target -o "SUSE"
cf create-space "prod"
cf create-space "dev"
cf target -s "dev"

# Apply open security rule to SUSE/dev
#cf unbind-security-group public_networks SUSE dev
#TMP=$(mktemp)
#cat << EOT >> $TMP
#[
#   {
#      "destination":"0.0.0.0-255.255.255.255",
#      "protocol":"all"
#   }
#]
#EOT
#
#cf create-security-group all-traffic $TMP
#cf bind-security-group all-traffic SUSE dev

#echo "Set the admin password to whatever was configured in secrets, please enter this manually"
#cf passwd

# Deploy Node env
git clone https://github.com/cf-stratos/node-env
cd node-env
cf push
