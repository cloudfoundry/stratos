# #!/usr/bin/env bash
#
# if [ -z "$SSH_COMMAND" ]; then
#     echo "Need to set SSH_COMMAND as shown here: https://github.com/hpcloud/code-engine/tree/master/ucp#deploy-with-a-script"
#     # export SSH_COMMAND="ssh -i /Users/wchrisjohnson/src/stackato/hcp-developer/.vagrant/machines/node/vmware_fusion/private_key vagrant@192.168.200.3"
#     exit 1
# fi
#
# set -eu
#
# HCP_NODE_ENDPOINT="${HCP_NODE_ENDPOINT:-http://192.168.200.3}"
# HCP_MASTER_ENDPOINT="${HCP_MASTER_ENDPOINT:-http://192.168.200.2:8080}"
# # IDENTITY_TLS_ENDPOINT="https://192.168.200.3"
# SSH_COMMAND="${SSH_COMMAND:-"ssh $HCP_JUMPBOX"}"
# HCP_JUMPBOX="${HCP_JUMPBOX:-$HCP_MASTER_ENDPOINT}"
#
# wait_for_success() {
#   COMMAND=$1;
#   MAX_WAIT=1200
#   START=$(date +%s)
#   echo "  waiting for command to succeed, for up to $MAX_WAIT seconds..."
#   echo "  $COMMAND"
#   printf "  "
#   until eval $COMMAND; do
#     NOW=$(date +%s)
#     DURATION=$(( $NOW - $START ))
#     printf "."
#     if [ "$DURATION" -gt "$MAX_WAIT" ]; then
#       echo "  ...timed out."
#       exit 1
#     fi
#     sleep 1
#   done;
#   END=$(date +%s)
#   DURATION=$(( $END - $START ))
#   echo ""
#   echo "  ...succeeded, after $DURATION second(s)."
#   return 0
# }
#
# wait_for_task() {
#   echo "wait_for_task: [$1]"
#   wait_for_success "$SSH_COMMAND curl -s -H \\\"$AUTHORIZATION_HEADER\\\" ${HCP_NODE_ENDPOINT}:${HCP_PORT}/v1/tasks/$1 | jq --raw-output '.status' | grep success"
# }
#
# main() {
#   echo "Deploying to HCP endpoints at"
#   echo "  master (HCP_NODE_ENDPOINT): ${HCP_NODE_ENDPOINT}"
#   echo "  node (HCP_MASTER_ENDPOINT): ${HCP_MASTER_ENDPOINT}"
#   echo "  Using jumpbox: (HCP_JUMPBOX): ${HCP_JUMPBOX}"
#
#   echo "===="
#   echo "Waiting for HCP to start..."
#   wait_for_success "$SSH_COMMAND curl -s --connect-timeout 10 --max-time 10 ${HCP_MASTER_ENDPOINT}";
#
#   echo "======"
#   echo "Retrieving HCP port..."
#   wait_for_success "$SSH_COMMAND curl -s --connect-timeout 10 --max-time 10 ${HCP_MASTER_ENDPOINT}/api/v1/namespaces/hcp/services/ipmgr | jq '.spec.ports[0].nodePort'";
#   HCP_PORT=$($SSH_COMMAND curl -Ss ${HCP_MASTER_ENDPOINT}/api/v1/namespaces/hcp/services/ipmgr | jq '.spec.ports[0].nodePort')
#   echo "HCP_PORT: ${HCP_PORT}"
#
#   echo "======"
#   echo "Retrieving Identity endpoint..."
#   IDENTITY_ENDPOINT=$($SSH_COMMAND curl -Ss ${HCP_MASTER_ENDPOINT}/api/v1/namespaces/hcp/services/ident-api | jq --raw-output '.status.loadBalancer.ingress[0].hostname')
#   echo "Identity endpoint LB: $IDENTITY_ENDPOINT"
#   if [[ -z $IDENTITY_ENDPOINT || $IDENTITY_ENDPOINT == 'null' ]]; then
#     IDENTITY_PORT=$(curl -Ss $HCP_MASTER_ENDPOINT/api/v1/namespaces/hcp/services/ident-api | jq '.spec.ports[0].nodePort')
#     IDENTITY_ENDPOINT=https://${HCP_NODE_ENDPOINT#http://}:$IDENTITY_PORT
#   else
#     IDENTITY_ENDPOINT="https://${IDENTITY_ENDPOINT}:443"
#   fi
#   echo "IDENTITY_ENDPOINT: ${IDENTITY_ENDPOINT}"
#
#   echo "======"
#   echo "Retrieving Access Token..."
#   ACCESS_TOKEN=$(curl -k -s --connect-timeout 10 --max-time 10 -H "authorization: Basic aGNwOg==" -d 'grant_type=password&username=admin%40cnap.local&password=cnapadmin' ${IDENTITY_ENDPOINT}/oauth/token | jq --raw-output '.access_token')
#   echo "Access token:"
#   echo "$ACCESS_TOKEN"
#   if [[ -z $ACCESS_TOKEN ]]; then
#       echo "Unable to get Access Token"
#       exit 1
#   fi
#
#   export AUTHORIZATION_HEADER="authorization: bearer $ACCESS_TOKEN"
#
#   echo "======"
#   echo "Deleting UAA client 'console'..."
#   curl -s -k -i -X "DELETE" -H \"$AUTHORIZATION_HEADER\" $IDENTITY_ENDPOINT/oauth/clients/console || true
#
#   echo "======"
#   echo "Deleting the instance of the service..."
#   TASK_DELETE=$(curl -s -X DELETE -H "authorization: bearer $ACCESS_TOKEN" -H "Content-Type: application/json" ${HCP_NODE_ENDPOINT}:${HCP_PORT}/v1/instances/hsc | jq --raw-output '.code')
#   echo "deletion task: $TASK_DELETE"
#   if [[ $TASK_DELETE == *404* ]]; then
#     echo "nothing to delete..."
#   else
#     echo "======"
#     echo "Waiting for deletion to complete..."
#     wait_for_task $TASK_DELETE
#     wait_for_success "!($SSH_COMMAND curl -s ${HCP_MASTER_ENDPOINT}/api/v1/namespaces/hsc/services/hsc-console | grep nodePort)";
#   fi
#
#   echo "======"
#   echo "Deploying service definition and instance..."
#   echo "    Uploading Service definition to HCP..."
#   cat output/sdl.json
#   SDL=$(cat output/sdl.json | base64)
#   $SSH_COMMAND "echo \"$SDL\" | base64 -d > sdl.json"
#   TASK_SDL=$($SSH_COMMAND curl -s -H \"Content-Type: application/json\" -H "authorization: bearer $ACCESS_TOKEN" -XPOST -d @./sdl.json ${HCP_NODE_ENDPOINT}:${HCP_PORT}/v1/services)
#   echo "    Waiting for HCP to process SDL..."
#   wait_for_task $TASK_SDL
#
#   echo "    Creating service instance in HCP..."
#   cat output/instance.json
#   IDL=$(cat output/instance.json | base64)
#   $SSH_COMMAND "echo \"$IDL\" | base64 -d > idl.json"
#   TASK_IDL=$($SSH_COMMAND curl -s -H \"Content-Type: application/json\" -H "authorization: bearer $ACCESS_TOKEN" -XPOST -d @./idl.json ${HCP_NODE_ENDPOINT}:${HCP_PORT}/v1/instances)
#   echo "    Waiting for HCP to process instance upload task..."
#   wait_for_task $TASK_IDL
#
#   echo "======"
#   echo "Waiting for HCP to tell us that hsc service started..."
#   wait_for_success "$SSH_COMMAND curl -s ${HCP_MASTER_ENDPOINT}/api/v1/namespaces/hsc/services/hsc-console | grep nodePort";
#
#   # echo "======"
#   # echo "Waiting for hce service to really start..."
#   # SERVICE_JSON=$($SSH_COMMAND curl -s ${HCP_MASTER_ENDPOINT}/api/v1/namespaces/helion-code-engine/services/hce-rest);
#   # HCE_API_PORT=$(echo $SERVICE_JSON | jq '.spec.ports[0].nodePort');
#   # HCE_URL="${HCP_NODE_ENDPOINT}:${HCE_API_PORT}"
#   # wait_for_success "$SSH_COMMAND curl -s --connect-timeout 10 --max-time 10 ${HCE_URL}/info";
#
#   # echo "====="
#   # echo "Waiting for HCP to tell us concourse web started..."
#   # wait_for_success "$SSH_COMMAND curl -s ${HCP_MASTER_ENDPOINT}/api/v1/namespaces/helion-code-engine/services/concourse-web | jq '.spec.ports[0].nodePort'"
#
#   # echo "===="
#   # echo "Waiting for concource web to really start..."
#   # CONCOURSE_WEB_PORT=$($SSH_COMMAND curl -s ${HCP_MASTER_ENDPOINT}/api/v1/namespaces/helion-code-engine/services/concourse-web | jq '.spec.ports[0].nodePort')
#   # CONCOURSE_URL="${HCP_NODE_ENDPOINT}:${CONCOURSE_WEB_PORT}"
#   # wait_for_success "$SSH_COMMAND curl -s --connect-timeout 10 --max-time 10 ${CONCOURSE_URL}";
#
#   if [[ "http://192.168.200.3" == "$HCP_NODE_ENDPOINT" ]]; then
#     echo ""
#     echo "Console endpoints"
#
#     HTTP_PORT=$(curl -s ${HCP_MASTER_ENDPOINT}/api/v1/namespaces/hsc/services/hsc-console | jq --raw-output '.spec.ports[0].nodePort')
#     echo "HTTP: ${HCP_NODE_ENDPOINT}:${HTTP_PORT}"
#
#     HTTPS_PORT=$(curl -s ${HCP_MASTER_ENDPOINT}/api/v1/namespaces/hsc/services/hsc-console | jq --raw-output '.spec.ports[1].nodePort')
#     echo "HTTPS: ${HCP_NODE_ENDPOINT}:${HTTPS_PORT}"
#
#     echo ""
#     echo "This is a local deployment vs AWS, etc. - skipping load balancer detection"
#     echo ""
#
#     echo "completed after $SECONDS seconds"
#     exit 0
#   fi
#
# #   echo "======"
# #   echo "Computing HCE REST LB address..."
# #   HCE_REST_PORT_LB=$($SSH_COMMAND curl -s ${HCP_MASTER_ENDPOINT}/api/v1/namespaces/helion-code-engine/services/hce-rest | jq --raw-output '.spec.ports[0].targetPort')
# #   HCE_REST_HOST_LB=$($SSH_COMMAND curl -s ${HCP_MASTER_ENDPOINT}/api/v1/namespaces/helion-code-engine/services/hce-rest | jq --raw-output '.status.loadBalancer.ingress[0].hostname')
# #   HCE_REST_URL_LB=http://$HCE_REST_HOST_LB:$HCE_REST_PORT_LB
#
# #   echo "======"
# #   echo "Waiting for HCE REST Load Balancer to come online..."
# #   wait_for_success "curl -s --connect-timeout 10 --max-time 10 $HCE_REST_URL_LB";
#
# #   echo "===="
# #   echo "Computing Concourse web LB address..."
# #   CONCOURSE_WEB_PORT_LB=$($SSH_COMMAND curl -s ${HCP_MASTER_ENDPOINT}/api/v1/namespaces/helion-code-engine/services/concourse-web | jq --raw-output '.spec.ports[0].targetPort')
# #   CONCOURSE_WEB_HOST_LB=$($SSH_COMMAND curl -s ${HCP_MASTER_ENDPOINT}/api/v1/namespaces/helion-code-engine/services/concourse-web | jq --raw-output '.status.loadBalancer.ingress[0].hostname')
# #   CONCOURSE_WEB_URL_LB=http://$CONCOURSE_WEB_HOST_LB:$CONCOURSE_WEB_PORT_LB
#
# #   echo "===="
# #   echo "Waiting for concourse LB to come online..."
# #   wait_for_success "curl -s --connect-timeout 10 --max-time 10 $CONCOURSE_WEB_URL_LB";
#
# #   HCP_VERSION=$($SSH_COMMAND curl -s ${HCP_MASTER_ENDPOINT}/version)
# #   echo $HCP_VERSION > hcp_version.txt
#
# #   echo "${HCE_REST_URL_LB}" > hce_url.txt
# #   echo "${CONCOURSE_WEB_URL_LB}" > concourse_url.txt
#
# #   echo ""
# #   echo "Concourse web endpoint: ${CONCOURSE_WEB_URL_LB}"
# #   echo "HCE endpoint: ${HCE_REST_URL_LB}"
# #   echo ""
#
#   echo "completed after $SECONDS seconds"
#
# }
#
# [[ $0 != "$BASH_SOURCE" ]] || main "$@"
