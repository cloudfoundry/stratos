#!/bin/bash

set -e

echo "Starting Stratos UI"

CF_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
TOP_LEVEL=${CF_DIR}/../../
DB_MIGRATE_DIR=$CF_DIR/db-migration
STRATOS_DB_ENV=$CF_DIR/.env_vars
GOOSE_BIN_DIR=$DB_MIGRATE_DIR/bin
DEPLOY_DIR=$CF_DIR/..
DBMIGRATE_BIN_DIR="$CF_DIR/../db/migrations"

# Try and parse the VCAP_SERVICES env var for DB Config
$DB_MIGRATE_DIR/parseVcapServices > $STRATOS_DB_ENV
source $STRATOS_DB_ENV
rm $STRATOS_DB_ENV

# DB Migration

function handleGooseResult {
  if [ $? -eq 0 ]; then
    echo "Database successfully migrated"
  else
    echo "Database migration failed"
    exit 1
  fi
}

# Only migrate on instance index 0
if [ "$CF_INSTANCE_INDEX" -eq "0" ]; then
  if [ -n "$DB_TYPE" ]; then
    echo "Attempting to migrate database"

    case $DB_TYPE in
    "postgresql")
        echo "Migrating postgresql instance on $DB_HOST"
        ./stratos-dbmigrator -cf -env cf_postgres --path deploy/db up
        handleGooseResult
        ;;
    "mysql")
        echo "Migrating mysql instance on $DB_HOST"
        ./stratos-dbmigrator -cf -env cf_mysql --path deploy/db up
        handleGooseResult
        ;;
    *)
        echo Unknown DB type \'$DB_TYPE\'?
        ;;
    esac
  fi
else
  echo "Skipping DB migration => not index 0 ($CF_INSTANCE_INDEX)"  
fi

echo "Starting..."
./portal-proxy
