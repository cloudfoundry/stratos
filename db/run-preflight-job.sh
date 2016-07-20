#!/bin/bash
set -e

execStatement() {
    stmt=$1
    PGPASSFILE=/tmp/pgpass psql -U $POSTGRES_USER -h $DB_HOST -p $CFGDB_PORT -d $POSTGRES_DB -w -tc "$stmt"
}

# Step 1 - Set the lock file on the shared volume
MIGRATION_VOLUME=hsc-migration-volume
UPGRADE_LOCK_FILE=upgrade.lock
echo "Adding $UPGRADE_LOCK_FILE file to the shared migration volume $MIGRATION_VOLUME."
touch /$MIGRATION_VOLUME/$UPGRADE_LOCK_FILE

echo "Created the upgrade lock file."

# Step 2 - Migrate the database if necessary
echo "$DB_HOST:$CFGDB_PORT:$POSTGRES_DB:$POSTGRES_USER:$POSTGRES_PASSWORD" > /tmp/pgpass
chmod 0600 /tmp/pgpass

stackatoDbExists=$(execStatement "SELECT 1 FROM pg_database WHERE datname = '$PGSQL_DATABASE';")
if [ -z "$stackatoDbExists" ] ; then
  echo "Database not found. Ok to exit normally as postflight job will create database."
  exit 0
else
  echo "Database found - ready to migrate."

  # Check the version
  /go/bin/goose dbversion

  # Check the status
  /go/bin/goose status

  # Run migrations
  /go/bin/goose --env=default up

  # CHeck the status
  /go/bin/goose status

  # Check the version
  /go/bin/goose dbversion

  exit 0
fi

echo "Database operation(s) complete."

exit 0
