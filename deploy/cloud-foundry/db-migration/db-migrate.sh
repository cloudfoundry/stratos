#!/bin/bash

set -e

echo "Migrating database"

DB_MIGRATE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
#echo !!DB_MIGRATE_DIR $DB_MIGRATE_DIR
#ls -la $DB_MIGRATE_DIR
DEPLOY_DIR=${DB_MIGRATE_DIR}/../../
#BOWER_PATH=${NODE_HOME}/bin
#echo !!DEPLOY_DIR $DEPLOY_DIR
#ls -la $DEPLOY_DIR

export STRATOS_TEMP=$(mktemp -d)

export GOPATH=${DB_MIGRATE_DIR}/goose
export GOBIN=$GOPATH/bin
go get bitbucket.org/liamstask/goose/cmd/goose

export STRATOS_DB_ENV="$STRATOS_TEMP/db.env"
node ${DB_MIGRATE_DIR}/parse_db_environment.js $STRATOS_DB_ENV
source $STRATOS_DB_ENV

echo $DB_TYPE
echo $DB_HOST
echo $DB_PORT
echo $DB_USERNAME
echo $DB_PASSWORD
echo $DB_NAME

cd $DEPLOY_DIR
case $DB_TYPE in
"postgres")
    $GOBIN/goose -env cf_postgres up
    exit 0
    ;;
"mysql")
    $GOBIN/goose -env mysql up
    exit 0
    ;;
*)
    echo Unknown DB type '$DB_TYPE'
    ;;
esac
