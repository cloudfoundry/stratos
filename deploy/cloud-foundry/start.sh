#!/bin/bash

set -e

echo "Starting Stratos"

CF_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
TOP_LEVEL=${CF_DIR}/../../
DB_CONF_DIR=./deploy/db

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
  echo "Attempting to migrate database"
  ./jetstream -cf --path ${DB_CONF_DIR} up
  handleGooseResult
else
  echo "Skipping DB migration => not index 0 ($CF_INSTANCE_INDEX)"  
fi

echo "Starting..."
./jetstream
