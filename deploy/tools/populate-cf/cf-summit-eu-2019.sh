#!/bin/bash
#set -e

# This script will populate Cloud Foundry with a set of orgs, spaces and apps.

ORGNAME="CF Summit 2019"
ORGNAME2="SUSE Hackweek"
ORGNAME3="SUSE CAP"
ORGNAME4="SUSE Developers"
SPACENAME=dev
SPACENAME2=prod
SPACENAME3=test

ORGQUOTA_NAME=cf-summit-org-quota
ORGQUOTA_TOTALMEMORY=100M
ORGQUOTA_APPINSTANCEMEMORY=50M
ORGQUOTA_ROUTES=50
ORGQUOTA_SERVICEINSTANCES=50
ORGQUOTA_APPINSTANCES=50

SPACEQUOTA_NAME=cf-summit-space-quota
SPACEQUOTA_TOTALMEMORY=70M
SPACEQUOTA_APPINSTANCEMEMORY=50M
SPACEQUOTA_ROUTES=6
SPACEQUOTA_SERVICEINSTANCES=5
SPACEQUOTA_APPINSTANCES=5

SERVICE_TYPE="persi-nfs"
SERVICE_NAME="cf-summit-persi-nfs"

SERVICEINSTANCE_CF_1_TYPE=p-mysql
SERVICEINSTANCE_CF_1_PLAN=10mb
SERVICEINSTANCE_CF_1_NAME=cf-summit-p-mysql-10mb
SERVICEINSTANCE_CF_1_PARAMS='{"name":"value1","name":"value1"}'

SERVICEINSTANCE_CF_2_TYPE=p-mysql
SERVICEINSTANCE_CF_2_PLAN=20mb
SERVICEINSTANCE_CF_2_NAME=cf-summit-p-mysql-20mb
SERVICEINSTANCE_CF_2_PARAMS='{"name":"value2","name":"value2"}'

SERVICEINSTANCE_SCF_1_TYPE=$SERVICE_TYPE
SERVICEINSTANCE_SCF_1_PLAN=Existing
SERVICEINSTANCE_SCF_1_NAME=cf-summit-mysql-dev-1
SERVICEINSTANCE_SCF_1_PARAMS='{"name":"value3","name":"value3"}'

# SERVICEINSTANCE_SCF_2_TYPE=$SERVICE_TYPE
# SERVICEINSTANCE_SCF_2_PLAN=20mb
# SERVICEINSTANCE_SCF_2_NAME=cf-summit-mysql-dev-2
# SERVICEINSTANCE_SCF_2_PARAMS='{"name":"value4","name":"value4"}'

# function login {
#   cf login -a https://api.local.pcfdev.io --skip-ssl-validation
# }

function createQuota {
  echo Creating Quota: $1
  echo Total Memory $2
  echo Instance Memory $3
  echo Routes $4
  echo Service Instances $5
  echo App Instances $6
  
  if [ "$7" = true ]; then
    #cf create-quota QUOTA [-m TOTAL_MEMORY] [-i INSTANCE_MEMORY] [-r ROUTES] [-s SERVICE_INSTANCES] [-a APP_INSTANCES] [--allow-paid-service-plans] [--reserved-route-ports RESERVED_ROUTE_PORTS]
    cf create-quota "$1" -m "$2" -i "$3" -r "$4" -s "$5" -a "$6"
    cf quotas
  else
    #cf create-space-quota QUOTA [-i INSTANCE_MEMORY] [-m MEMORY] [-r ROUTES] [-s SERVICE_INSTANCES] [-a APP_INSTANCES] [--allow-paid-service-plans] [--reserved-route-ports RESERVED_ROUTE_PORTS]
    cf target -o "$ORGNAME"
    cf create-space-quota "$1" -m "$2" -i "$3" -r "$4" -s "$5" -a "$6"
    cf space-quotas
  fi
}

# Create an org, optionally assign it the qiven quota
function createOrg {
  if [ -z "$2" ]; then
    cf create-org "$1"
  else
    cf create-org "$1" -q "$2"
  fi
}

function createSpace {
  SPACE_QUOTA_ARGS=""
  SPACE_ORG=$1
  if [ "$2" = "true" ]; then
    SPACE_QUOTA_ARGS=-q $SPACEQUOTA_NAME
  fi

  echo "Creating spaces in $SPACE_ORG : $SPACE_QUOTA_ARGS"

  #cf create-space SPACE [-o ORG] [-q SPACE_QUOTA]
  cf create-space "$SPACENAME" -o "$SPACE_ORG" ${SPACE_QUOTA_ARGS}
  cf create-space "$SPACENAME2" -o "$SPACE_ORG" ${SPACE_QUOTA_ARGS}
  cf create-space "$SPACENAME3" -o "$SPACE_ORG" ${SPACE_QUOTA_ARGS}
}

function createServiceInstance {
  echo Creating service: "$1", Type: "$2", Plan: "$3"
  #cf create-service SERVICE PLAN SERVICE_INSTANCE -c '{"name":"value","name":"value"}'
  cf create-service "$2" "$3" "$1" -c "$4"
}

function createServiceInstances {
  cf target -o "SUSE CAP" -s dev
  createServiceInstance "$SERVICEINSTANCE_NAME" "$SERVICEINSTANCE_TYPE" "$SERVICEINSTANCE_PLAN" "$SERVICEINSTANCE_PARAMS"
  createServiceInstance "$SERVICEINSTANCE_NAME2" "$SERVICEINSTANCE_TYPE2" "$SERVICEINSTANCE_PLAN2" "$SERVICEINSTANCE_PARAMS2"
}

function createApp {
  echo Creating App: "$1"
  echo Disk Limit: "$2"
  echo Memory Limit: "$3"
  echo Number of instances: "$4"

  cf target -o "$ORGNAME" -s "$SPACENAME"
  cf push "$1" -k "$2" -m "$3" -i "$4" --no-manifest --no-start
}

function createApps {
  TEMP_PUSH_FOLDER=temp-push-folder
  rm -rf $TEMP_PUSH_FOLDER
  mkdir $TEMP_PUSH_FOLDER -p
  pushd $TEMP_PUSH_FOLDER

  # Create these first, so they are not the most recent apps
  cf target -o "SUSE CAP" -s prod
  # rm -rf cf-demo-app
  # git clone https://github.com/nwmac/cf-demo-app
  # pushd cf-demo-app
  # cf push SUSECON_Demo_App --random-route -p .
  # popd

  rm -rf cf-quick-app
  git clone https://github.com/nwmac/cf-quick-app.git
  pushd cf-quick-app

  cf target -o "SUSE CAP" -s dev
  cf push Scheduler -p . -b binary_buildpack -i 4
  cf push Notifier -p . -b binary_buildpack
  cf push StaticWebSite -p . -b binary_buildpack
  cf push APIServer -p . -b binary_buildpack

  # Stop one of the apps
  cf stop Scheduler

  cf target -o "$ORGNAME" -s dev

  # Create an app in the 'Staging Failed' state
  git checkout staging-fails
  cf push BillingServer -p .
  popd


  # Create a few others to show space quotas
  rm -rf empty-app
  mkdir empty-app -p
  pushd empty-app
  touch delete-me
  # Won't be running, so won't actually use any quota
  createApp "IncompleteApp" "5M" "5M" 1
  popd

  rm -rf go-env
  git clone https://github.com/cf-stratos/go-env
  pushd go-env
  cf push -m 22M

  # This app will use 3 application instances from teh quota
  cf scale go-env -i 3 -f

  # Push the same app but call it TestApp
  #cf push TestApp -p . --no-start

  popd

  popd
}

function bindServiceInstancesToApp {
  cf target -o "SUSE CAP" -s dev
  cf bind-service "Scheduler" "$SERVICEINSTANCE_NAME"
  cf bind-service "Notifier" "$SERVICEINSTANCE_NAME2"
  cf bind-service "Notifier" "$SERVICEINSTANCE_NAME"
  cf bind-service "StaticWebSite" "$SERVICEINSTANCE_NAME2"
}

function create {
  createQuota "$ORGQUOTA_NAME" "$ORGQUOTA_TOTALMEMORY" "$ORGQUOTA_APPINSTANCEMEMORY" "$ORGQUOTA_ROUTES" "$ORGQUOTA_SERVICEINSTANCES" "$ORGQUOTA_APPINSTANCES" true
  createOrg "$ORGNAME" "$ORGQUOTA_NAME"
  createSpace "$ORGNAME"
  createOrg "$ORGNAME2"
  createSpace "$ORGNAME2"
  createOrg "$ORGNAME3"
  createSpace "$ORGNAME3"
  createOrg "$ORGNAME4" "$ORGQUOTA_NAME"
  createSpace "$ORGNAME4"
  createQuota "$SPACEQUOTA_NAME" "$SPACEQUOTA_TOTALMEMORY" "$SPACEQUOTA_APPINSTANCEMEMORY" "$SPACEQUOTA_ROUTES" "$SPACEQUOTA_SERVICEINSTANCES" "$SPACEQUOTA_APPINSTANCES" false

  # Assign space quotas only in the first org
  cf target -o "$ORGNAME"
  cf set-space-quota "$SPACENAME" "$SPACEQUOTA_NAME"
  cf set-space-quota "$SPACENAME2" "$SPACEQUOTA_NAME"
  cf set-space-quota "$SPACENAME3" "$SPACEQUOTA_NAME"

  if [ "$CREATE_SERVICES" = true ]; then
    createServiceInstances
  fi

  createApps

  if [ "$CREATE_SERVICES" = true ]; then
    bindServiceInstancesToApp
  fi
}

function showHelp {

  echo This script creates a set of orgs and spaces and populates a few applications.
  echo Options:
  echo   -c to clean the orgs, space and apps
  echo   -s to create services
}

function clean {
  echo "Cleaning...."
  echo Targeting $ORGNAME and deleting it\'s content
  cf target -o "$ORGNAME"
  cf delete-space "$SPACENAME" -f
  cf delete-space "$SPACENAME2" -f
  cf delete-space "$SPACENAME3" -f
  cf delete-space-quota "$SPACEQUOTA_NAME" -f

  echo Deleting Orgs
  # Delete org will also delete spaces, apps, service instances, routes, private domains and space-scoped service brokers
  cf delete-org "$ORGNAME" -f
  cf delete-org "$ORGNAME2" -f
  cf delete-org "$ORGNAME3" -f
  cf delete-org "$ORGNAME4" -f
  cf delete-org "$ORGNAME5" -f
  cf delete-org "$ORGNAME6" -f
  cf delete-quota "$ORGQUOTA_NAME" -f
}

echo "================================================="
echo "Org, Space, Quota, Apps script                   "
echo "================================================="
echo ""

# Quick check that the cf cli is available
echo "Checking that the CF cli is available..."
cf --version
if [ ! $? -eq 0 ]; then
  echo "This script needs the CF cli to be installed"
  exit -1
fi

CLEAN=false
CREATE_SERVICES=false
CF=SCF
while getopts ":cpsh" opt ; do
  case $opt in
    h)
      showHelp
      exit 0
    ;;
    c)
      CLEAN=true
    ;;
    s)
      CREATE_SERVICES=true
    ;;
    p)
      CF=CFDEV
    ;;
  esac
done

if [ "$CF" = "SCF" ]; then
  echo Using SCF
  SERVICEINSTANCE_NAME=$SERVICEINSTANCE_SCF_1_NAME
  SERVICEINSTANCE_TYPE=$SERVICEINSTANCE_SCF_1_TYPE
  SERVICEINSTANCE_PLAN=$SERVICEINSTANCE_SCF_1_PLAN
  SERVICEINSTANCE_PARAMS=$SERVICEINSTANCE_SCF_1_PARAMS

  # SERVICEINSTANCE_NAME2=$SERVICEINSTANCE_SCF_2_NAME
  # SERVICEINSTANCE_TYPE2=$SERVICEINSTANCE_SCF_2_TYPE
  # SERVICEINSTANCE_PLAN2=$SERVICEINSTANCE_SCF_2_PLAN
  # SERVICEINSTANCE_PARAMS2=$SERVICEINSTANCE_SCF_2_PARAMS
else
  echo Using CF DEV
  SERVICEINSTANCE_NAME=$SERVICEINSTANCE_CF_1_NAME
  SERVICEINSTANCE_TYPE=$SERVICEINSTANCE_CF_1_TYPE
  SERVICEINSTANCE_PLAN=$SERVICEINSTANCE_CF_1_PLAN
  SERVICEINSTANCE_PARAMS=$SERVICEINSTANCE_CF_1_PARAMS

  SERVICEINSTANCE_NAME2=$SERVICEINSTANCE_CF_2_NAME
  SERVICEINSTANCE_TYPE2=$SERVICEINSTANCE_CF_2_TYPE
  SERVICEINSTANCE_PLAN2=$SERVICEINSTANCE_CF_2_PLAN
  SERVICEINSTANCE_PARAMS2=$SERVICEINSTANCE_CF_2_PARAMS
fi

#login
if [ "$CLEAN" = true ]; then
  echo "==========================="
  echo "Cleaning orgs and spaces..."
  echo "==========================="
  clean
  exit 0
fi

echo "================================================="
echo "Creating orgs, spaces, quota and applications ..."
echo "================================================="

create

echo ""
echo "All done"
