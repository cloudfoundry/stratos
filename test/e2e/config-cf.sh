#!/usr/bin/env sh

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
cf unbind-security-group public_networks SUSE dev
TMP=$(mktemp)
cat << EOT >> $TMP
[
   {
      "destination":"0.0.0.0-255.255.255.255",
      "protocol":"all"
   }
]
EOT

cf create-security-group all-traffic $TMP
cf bind-security-group all-traffic SUSE dev

# Deploy Node env
git clone https://github.com/irfanhabib/node-env
cd node-env
cf push
