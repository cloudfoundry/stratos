#!/bin/bash
set -eu

# How to call this:
# ./delete_from_local_hcp.sh -u http://192.168.200.3:30718

# Init the HCP URL
HCP_URL=""

while getopts ":u:" opt; do
  case $opt in
    u)
      HCP_URL="$OPTARG"
      ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      exit 1
      ;;
    :)
      echo "Option -$OPTARG requires an argument." >&2
      exit 1
      ;;
  esac
done

# HCP_MASTER_ENDPOINT="${HCP_MASTER_ENDPOINT:-http://192.168.200.2:8080}"
# HCP_NODE_ENDPOINT="${HCP_NODE_ENDPOINT:-http://192.168.200.3}"
# HCP_JUMPBOX="${HCP_JUMPBOX:-$HCP_MASTER_ENDPOINT}"
# SSH_COMMAND="${SSH_COMMAND:-"ssh $HCP_JUMPBOX"}"
#
# echo "Deploying to HCP endpoints at"
# echo "  master (HCP_NODE_ENDPOINT): ${HCP_NODE_ENDPOINT}"
# echo "  node (HCP_MASTER_ENDPOINT): ${HCP_MASTER_ENDPOINT}"
# echo "  Using jumpbox: (HCP_JUMPBOX): ${HCP_JUMPBOX}"

# echo "======"
# echo "Retrieving Identity endpoint..."
# IDEP=$($SSH_COMMAND curl -Ss ${HCP_MASTER_ENDPOINT}/api/v1/namespaces/hcp/services/ident-api | jq --raw-output '.status.loadBalancer.ingress[0].hostname')
# IDENTITY_ENDPOINT="http://${IDEP}:8080"
# echo "IDENTITY_ENDPOINT: ${IDENTITY_ENDPOINT}"
#
# echo "======"
# echo "Retrieving Access Token..."
# ACCESS_TOKEN=$(curl -s --connect-timeout 10 --max-time 10 -H "authorization: Basic aGNwOg==" -d 'grant_type=password&username=admin%40cnap.local&password=cnapadmin' ${IDENTITY_ENDPOINT}/oauth/token | jq --raw-output '.access_token')
# echo "Access token:"
# echo "$ACCESS_TOKEN"
#
# echo "======"
# echo "Deleting 'code-engine-renamed'..."
# curl -s -i -X "DELETE" -H "authorization: bearer $ACCESS_TOKEN" $IDENTITY_ENDPOINT/oauth/clients/code-engine-renamed || true


echo " "
echo "Removing the Console fromo $HCP_URL ..."
curl -X DELETE ${HCP_URL}/v1/instances/hsc

echo " "
echo "Done"
