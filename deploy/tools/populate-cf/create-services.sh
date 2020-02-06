
# Change this to the test org in your CF
DEFAULT_ORG=pcfdev-org
# Change this to test space in the test org
DEFAULT_SPACE=pcfdev-space
# CF User, doesn't need to be admin
USER_NAME=admin
# CF User password
USER_PASS=admin
# CF API Endpoint
CF_API_ENDPOINT=https://api.local.pcfdev.io

# Skip login - run against whatever target the cf CLI is configured for
SKIP_LOGIN=false

BROKER_CRED=broker

while getopts ":o:s:u:p:a:n" opt ; do
    case $opt in
        o)
            DEFAULT_ORG="${OPTARG}"
            ;;
        s)
            DEFAULT_SPACE="${OPTARG}"
            ;;
        u)
            USER_NAME="${OPTARG}"
            ;;
        p)
            USER_PASS="${OPTARG}"
            ;;
        a)
            CF_API_ENDPOINT="${OPTARG}"
            ;;
        n)
            SKIP_LOGIN="true"
            ;;
    esac
done

function pushBrokerApp {
  local SERVICE=$1
  local APPNAME=$SERVICE-broker
  pushd ${TMP_DIR}
  cf push $APPNAME --no-start -m 128M -k 256M
  cf set-env $APPNAME BASE_GUID $(uuidgen)
  cf set-env $APPNAME CREDENTIALS '{"port": "4000", "host": "1.2.3.4"}'
  cf set-env $APPNAME SERVICE_NAME $SERVICE
  cf set-env $APPNAME SERVICE_PLAN_NAME shared
  cf set-env $APPNAME TAGS simple,shared
  cf set-env $APPNAME AUTH_USER $BROKER_CRED
  cf set-env $APPNAME AUTH_PASSWORD $BROKER_CRED
  cf env $APPNAME
  cf start $APPNAME
  popd
}

function createService {
  local SERVICE=$1
  local APPNAME=$SERVICE-broker
  local ORG=$2
  local SPACE=$3
  export SERVICE_URL=$(cf app $APPNAME | grep routes: | awk '{print $2}')
  local SPACE_ARGS=""
  if [ ! -z $SPACE ]; then
    cf target -o $ORG -s $SPACE
    SPACE_ARGS="--space-scoped"
  fi
  cf create-service-broker $SERVICE $BROKER_CRED $BROKER_CRED https://$SERVICE_URL $SPACE_ARGS
}

function makeServicePublic {
   local SERVICE=$1
  cf enable-service-access $SERVICE
}

function addServiceVisibilities {
  local SERVICE=$1
  local ORG=$2
  cf enable-service-access $SERVICE -o $ORG
}

if [ "${SKIP_LOGIN}" == "false" ]; then
    cf login  --skip-ssl-validation -a ${CF_API_ENDPOINT} -u ${USER_NAME} -p ${USER_PASS} -o ${DEFAULT_ORG} -s ${DEFAULT_SPACE}
fi

# Only clone the repository once
TMP_DIR=$(mktemp -d)
git clone https://github.com/cf-stratos/worlds-simplest-service-broker ${TMP_DIR}

# Create public service
pushBrokerApp public-service;
createService public-service;
makeServicePublic public-service;

# Create private service with one service plan visibility
pushBrokerApp private-service;
createService private-service;
addServiceVisibilities private-service $DEFAULT_ORG

# Create space scoped service
pushBrokerApp space-scoped-service 
createService space-scoped-service $DEFAULT_ORG $DEFAULT_SPACE
