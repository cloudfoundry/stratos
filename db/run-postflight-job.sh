#!/bin/bash
set -e

execStatement() {
    stmt=$1
    PGPASSFILE=/tmp/pgpass psql -U $POSTGRES_USER -h $DB_HOST -p $CFGDB_PORT -d $POSTGRES_DB -w -tc "$stmt"
}

execStatementsFromFile() {
    file=$1
    PGPASSFILE=/tmp/pgpass psql -U $PGSQL_USER -h $DB_HOST -p $CFGDB_PORT -d $PGSQL_DATABASE -w -f "$file"
}

# Step 1 - Create the database if necessary
echo "$DB_HOST:$CFGDB_PORT:$POSTGRES_DB:$POSTGRES_USER:$POSTGRES_PASSWORD" > /tmp/pgpass
echo "$DB_HOST:$CFGDB_PORT:$PGSQL_DATABASE:$PGSQL_USER:$PGSQL_PASSWORD" >> /tmp/pgpass
chmod 0600 /tmp/pgpass

stackatoDbExists=$(execStatement "SELECT 1 FROM pg_database WHERE datname = '$PGSQL_DATABASE';")
if [ -z "$stackatoDbExists" ] ; then
    execStatement "CREATE DATABASE \"$PGSQL_DATABASE\";"
    execStatement "CREATE USER $PGSQL_USER WITH ENCRYPTED PASSWORD '$PGSQL_PASSWORD';"
    execStatement "GRANT ALL PRIVILEGES ON DATABASE \"$PGSQL_DATABASE\" TO $PGSQL_USER;"
    execStatementsFromFile "$SQL"
else
    echo "$PGSQL_DATABASE already exists"
fi

echo "Database operation(s) complete."

# Step 2 - Set the lock file on the shared volume
MIGRATION_VOLUME=hsc-migration-volume
UPGRADE_LOCK_FILE=upgrade.lock
echo "Removing the $UPGRADE_LOCK_FILE file from the shared migration volume $MIGRATION_VOLUME."
rm /$MIGRATION_VOLUME/$UPGRADE_LOCK_FILE

echo "Removed the upgrade lock file."

exit 0
