#!/bin/bash
set -e

ORGNAME=cf-summit
SPACENAME=dev

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

#SERVICEINSTANCE_1_TYPE=p-mysql
#SERVICEINSTANCE_1_PLAN=512mb
#SERVICEINSTANCE_1_NAME=cf-summit-p-mysql
#SERVICEINSTANCE_1_PARAMS='{"name":"value1","name":"value1"}'

#SERVICEINSTANCE_2_TYPE=p-rabbitmq
#SERVICEINSTANCE_2_PLAN=standard
#SERVICEINSTANCE_2_NAME=cf-summit-p-rabbitmq
#SERVICEINSTANCE_2_PARAMS='{"name":"value2","name":"value2"}'

SERVICEINSTANCE_3_TYPE=mysql-dev
SERVICEINSTANCE_3_PLAN=10mb
SERVICEINSTANCE_3_NAME=cf-summit-mysql-dev-1
SERVICEINSTANCE_3_PARAMS='{"name":"value3","name":"value3"}'

SERVICEINSTANCE_4_TYPE=mysql-dev
SERVICEINSTANCE_4_PLAN=20mb
SERVICEINSTANCE_4_NAME=cf-summit-mysql-dev-2
SERVICEINSTANCE_4_PARAMS='{"name":"value4","name":"value4"}'

SERVICEINSTANCE_NAME=$SERVICEINSTANCE_3_NAME
SERVICEINSTANCE_NAME2=$SERVICEINSTANCE_4_NAME

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
    cf create-quota $1 -m $2 -i $3 -r $4 -s $5 -a $6
    cf quotas
  else
    #cf create-space-quota QUOTA [-i INSTANCE_MEMORY] [-m MEMORY] [-r ROUTES] [-s SERVICE_INSTANCES] [-a APP_INSTANCES] [--allow-paid-service-plans] [--reserved-route-ports RESERVED_ROUTE_PORTS]
    cf target -o $ORGNAME
    cf create-space-quota $1 -m $2 -i $3 -r $4 -s $5 -a $6
    cf space-quotas
  fi
}

function createOrg {
  #cf create-org ORG
  cf create-org $ORGNAME -q $ORGQUOTA_NAME
}

function createSpace {
  #cf create-space SPACE [-o ORG] [-q SPACE_QUOTA]
  cf create-space $SPACENAME -o $ORGNAME -q $SPACEQUOTA_NAME
}

function createServiceInstance {
  echo Creating service: $1, Type: $2, Plan: $3
  #cf create-service SERVICE PLAN SERVICE_INSTANCE -c '{"name":"value","name":"value"}'
  cf create-service $2 $3 $1 -c $4
}

function createServiceInstances {
  cf target -o $ORGNAME -s $SPACENAME
  #createServiceInstance $SERVICEINSTANCE_1_NAME $SERVICEINSTANCE_1_TYPE $SERVICEINSTANCE_1_PLAN $SERVICEINSTANCE_1_PARAMS
  #createServiceInstance $SERVICEINSTANCE_2_NAME $SERVICEINSTANCE_2_TYPE $SERVICEINSTANCE_2_PLAN $SERVICEINSTANCE_2_PARAMS
  createServiceInstance $SERVICEINSTANCE_NAME $SERVICEINSTANCE_3_TYPE $SERVICEINSTANCE_3_PLAN $SERVICEINSTANCE_3_PARAMS
  createServiceInstance $SERVICEINSTANCE_NAME2 $SERVICEINSTANCE_4_TYPE $SERVICEINSTANCE_4_PLAN $SERVICEINSTANCE_4_PARAMS
}

function createApp {
  echo Creating App: $1
  echo Disk Limit: $2
  echo Memory Limit: $3
  echo Number of instances: $4
  
  cf push $1 -k $2 -m $3 -i $4 --no-manifest --no-start
}

function createApps {
  TEMP_PUSH_FOLDER=temp-push-folder
  mkdir $TEMP_PUSH_FOLDER -p
  pushd $TEMP_PUSH_FOLDER
  touch delete-me
  createApp $APP_1_NAME $APP_1_DISK $APP_1_MEMORY $APP_1_INSTANCES
  createApp $APP_2_NAME $APP_2_DISK $APP_2_MEMORY $APP_2_INSTANCES
  createApp $APP_3_NAME $APP_3_DISK $APP_3_MEMORY $APP_3_INSTANCES
  popd
}

function bindServiceInstancesToApp {
  cf bind-service $APP_1_NAME $SERVICEINSTANCE_NAME
  cf bind-service $APP_2_NAME $SERVICEINSTANCE_NAME2
  cf bind-service $APP_3_NAME $SERVICEINSTANCE_NAME
  cf bind-service $APP_3_NAME $SERVICEINSTANCE_NAME2
  echo nope
}

function create {
  createQuota $ORGQUOTA_NAME $ORGQUOTA_TOTALMEMORY $ORGQUOTA_APPINSTANCEMEMORY $ORGQUOTA_ROUTES $ORGQUOTA_SERVICEINSTANCES $ORGQUOTA_APPINSTANCES true
  createOrg
  createQuota $SPACEQUOTA_NAME $SPACEQUOTA_TOTALMEMORY $SPACEQUOTA_APPINSTANCEMEMORY $SPACEQUOTA_ROUTES $SPACEQUOTA_SERVICEINSTANCES $SPACEQUOTA_APPINSTANCES false
  createSpace
  createServiceInstances
  ## bind to apps as well
  createApps
  bindServiceInstancesToApp
}

function clean {
  cf target -o $ORGNAME
  cf delete-space $SPACENAME -f
  cf delete-space-quota $SPACEQUOTA_NAME -f
  
  # Delete org will also delete spaces, apps, service instances, routes, private domains and space-scoped service brokers
  cf delete-org $ORGNAME -f
  cf delete-quota $ORGQUOTA_NAME -f
}

CLEAN=false
while getopts ":c" opt ; do
  case $opt in
    c)
      CLEAN=true
    ;;
  esac
done

#login
if [ "$CLEAN" = true ]; then
  clean
fi
create

echo This script has...
echo - Created an org \($ORGNAME\) and space \($SPACENAME\), both with custom quotas \($ORGQUOTA_NAME, $SPACEQUOTA_NAME\)
echo - Created 2 service instances \($SERVICEINSTANCE_NAME, $SERVICEINSTANCE_NAME2\)
echo - Created 3 apps \($APP_1_NAME, $APP_2_NAME, $APP_3_NAME\) and bound the service instances to them
echo See top of file for variables
echo ---------------
echo Add -c to do a real basic clean of any previous run
