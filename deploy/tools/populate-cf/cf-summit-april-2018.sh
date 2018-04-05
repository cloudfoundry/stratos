#!/bin/bash
set -e

ORGNAME="CF Summit 2018"
ORGNAME2="SUSE Hackweek"
ORGNAME3="SUSE CAP"
ORGNAME4="SUSE Dev"
ORGNAME5="Cloud Foundry Incubators"
ORGNAME6="Stratos Dev"
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
SPACEQUOTA_TOTALMEMORY=50M
SPACEQUOTA_APPINSTANCEMEMORY=20M
SPACEQUOTA_ROUTES=10
SPACEQUOTA_SERVICEINSTANCES=5
SPACEQUOTA_APPINSTANCES=10

SERVICEINSTANCE_PCF_1_TYPE=p-mysql
SERVICEINSTANCE_PCF_1_PLAN=512mb
SERVICEINSTANCE_PCF_1_NAME=cf-summit-p-mysql
SERVICEINSTANCE_PCF_1_PARAMS='{"name":"value1","name":"value1"}'

SERVICEINSTANCE_PCF_2_TYPE=p-rabbitmq
SERVICEINSTANCE_PCF_2_PLAN=standard
SERVICEINSTANCE_PCF_2_NAME=cf-summit-p-rabbitmq
SERVICEINSTANCE_PCF_2_PARAMS='{"name":"value2","name":"value2"}'

SERVICEINSTANCE_SCF_1_TYPE=mysql-dev
SERVICEINSTANCE_SCF_1_PLAN=10mb
SERVICEINSTANCE_SCF_1_NAME=cf-summit-mysql-dev-1
SERVICEINSTANCE_SCF_1_PARAMS='{"name":"value3","name":"value3"}'

SERVICEINSTANCE_SCF_2_TYPE=mysql-dev
SERVICEINSTANCE_SCF_2_PLAN=20mb
SERVICEINSTANCE_SCF_2_NAME=cf-summit-mysql-dev-2
SERVICEINSTANCE_SCF_2_PARAMS='{"name":"value4","name":"value4"}'

APP_1_NAME=cf-summit-app-1
APP_1_DISK=5M
APP_1_MEMORY=5M
APP_1_INSTANCES=1

APP_2_NAME=cf-summit-app-2
APP_2_DISK=5M
APP_2_MEMORY=5M
APP_2_INSTANCES=1

APP_3_NAME=cf-summit-app-3
APP_3_DISK=5M
APP_3_MEMORY=5M
APP_3_INSTANCES=2

function login {
  cf login -a https://api.local.pcfdev.io --skip-ssl-validation
}

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

function createOrg {
  #cf create-org ORG
  cf create-org "$1" -q "$2"
}

function createSpace {
  #cf create-space SPACE [-o ORG] [-q SPACE_QUOTA]
  cf create-space "$SPACENAME" -o "$ORGNAME" -q "$SPACEQUOTA_NAME"
  cf create-space "$SPACENAME2" -o "$ORGNAME" -q "$SPACEQUOTA_NAME"
  cf create-space "$SPACENAME3" -o "$ORGNAME" -q "$SPACEQUOTA_NAME"
}

function createServiceInstance {
  echo Creating service: "$1", Type: "$2", Plan: "$3"
  #cf create-service SERVICE PLAN SERVICE_INSTANCE -c '{"name":"value","name":"value"}'
  cf create-service "$2" "$3" "$1" -c "$4"
}

function createServiceInstances {
  cf target -o "$ORGNAME" -s "$SPACENAME"
  createServiceInstance "$SERVICEINSTANCE_NAME" "$SERVICEINSTANCE_TYPE" "$SERVICEINSTANCE_PLAN" "$SERVICEINSTANCE_PARAMS"
  createServiceInstance "$SERVICEINSTANCE_NAME2" "$SERVICEINSTANCE_TYPE2" "$SERVICEINSTANCE_PLAN2" "$SERVICEINSTANCE_PARAMS2"
}

function createApp {
  echo Creating App: "$1"
  echo Disk Limit: "$2"
  echo Memory Limit: "$3"
  echo Number of instances: "$4"
  
  cf push "$1" -k "$2" -m "$3" -i "$4" --no-manifest --no-start
}

function createApps {
  TEMP_PUSH_FOLDER=temp-push-folder
  mkdir "$TEMP_PUSH_FOLDER" -p
  pushd "$TEMP_PUSH_FOLDER"
  touch delete-me
  createApp "$APP_1_NAME" "$APP_1_DISK" "$APP_1_MEMORY" "$APP_1_INSTANCES"
  createApp "$APP_2_NAME" "$APP_2_DISK" "$APP_2_MEMORY" "$APP_2_INSTANCES"
  createApp "$APP_3_NAME" "$APP_3_DISK" "$APP_3_MEMORY" "$APP_3_INSTANCES"
  popd
}

function bindServiceInstancesToApp {
  cf bind-service "$APP_1_NAME" "$SERVICEINSTANCE_NAME"
  cf bind-service "$APP_2_NAME" "$SERVICEINSTANCE_NAME2"
  cf bind-service "$APP_3_NAME" "$SERVICEINSTANCE_NAME"
  cf bind-service "$APP_3_NAME" "$SERVICEINSTANCE_NAME2"
}

function create {
  createQuota "$ORGQUOTA_NAME" "$ORGQUOTA_TOTALMEMORY" "$ORGQUOTA_APPINSTANCEMEMORY" "$ORGQUOTA_ROUTES" "$ORGQUOTA_SERVICEINSTANCES" "$ORGQUOTA_APPINSTANCES" true
  createOrg "$ORGNAME" "$ORGQUOTA_NAME"
  createOrg "$ORGNAME2" "$ORGQUOTA_NAME"
  createOrg "$ORGNAME3" "$ORGQUOTA_NAME"
  createOrg "$ORGNAME4" "$ORGQUOTA_NAME"
  createOrg "$ORGNAME5" "$ORGQUOTA_NAME"
  createOrg "$ORGNAME6" "$ORGQUOTA_NAME"
  createQuota "$SPACEQUOTA_NAME" "$SPACEQUOTA_TOTALMEMORY" "$SPACEQUOTA_APPINSTANCEMEMORY" "$SPACEQUOTA_ROUTES" "$SPACEQUOTA_SERVICEINSTANCES" "$SPACEQUOTA_APPINSTANCES" false
  createSpace
  createServiceInstances
  createApps
  bindServiceInstancesToApp
}

function clean {
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

CLEAN=false
CF=SCF
while getopts ":cp" opt ; do
  case $opt in
    c)
      CLEAN=true
    ;;
    p)
      CF=PCF
    ;;
  esac
done

if [ "$CF" = "SCF" ]; then
  echo Using SCF
  SERVICEINSTANCE_NAME=$SERVICEINSTANCE_SCF_1_NAME
  SERVICEINSTANCE_TYPE=$SERVICEINSTANCE_SCF_1_TYPE
  SERVICEINSTANCE_PLAN=$SERVICEINSTANCE_SCF_1_PLAN
  SERVICEINSTANCE_PARAMS=$SERVICEINSTANCE_SCF_1_PARAMS

  SERVICEINSTANCE_NAME2=$SERVICEINSTANCE_SCF_2_NAME
  SERVICEINSTANCE_TYPE2=$SERVICEINSTANCE_SCF_2_TYPE
  SERVICEINSTANCE_PLAN2=$SERVICEINSTANCE_SCF_2_PLAN
  SERVICEINSTANCE_PARAMS2=$SERVICEINSTANCE_SCF_2_PARAMS
else
  echo Using PCF
  SERVICEINSTANCE_NAME=$SERVICEINSTANCE_PCF_1_NAME
  SERVICEINSTANCE_TYPE=$SERVICEINSTANCE_PCF_1_TYPE
  SERVICEINSTANCE_PLAN=$SERVICEINSTANCE_PCF_1_PLAN
  SERVICEINSTANCE_PARAMS=$SERVICEINSTANCE_PCF_1_PARAMS

  SERVICEINSTANCE_NAME2=$SERVICEINSTANCE_PCF_2_NAME
  SERVICEINSTANCE_TYPE2=$SERVICEINSTANCE_PCF_2_TYPE
  SERVICEINSTANCE_PLAN2=$SERVICEINSTANCE_PCF_2_PLAN
  SERVICEINSTANCE_PARAMS2=$SERVICEINSTANCE_PCF_2_PARAMS
fi

#login
if [ "$CLEAN" = true ]; then
  clean
fi
create

echo This script has
echo - Created an orgs and spaces, both with custom quotas \($ORGQUOTA_NAME, $SPACEQUOTA_NAME\)
echo - Created 2 service instances \($SERVICEINSTANCE_NAME, $SERVICEINSTANCE_NAME2\)
echo - Created 3 apps \($APP_1_NAME, $APP_2_NAME, $APP_3_NAME\) and bound the service instances to them
echo See top of file for variables
echo ---------------
echo Add -c to do a real basic clean of any previous run
