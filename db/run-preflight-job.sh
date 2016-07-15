#!/bin/bash
set -e

execStatement() {
    stmt=$1
    PGPASSFILE=/tmp/pgpass psql -U $POSTGRES_USER -h $DB_HOST -p $CFGDB_PORT -d $DB -w -tc "$stmt"
}

echo "$DB_HOST:$CFGDB_PORT:$DB:$POSTGRES_USER:$POSTGRES_PASSWORD" > /tmp/pgpass
chmod 0600 /tmp/pgpass

stratosExists=$(execStatement "SELECT 1 FROM pg_database WHERE datname = '$STRATOS_DB';")
if [ -z "$stratosExists" ] ; then
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

echo "Success!"

exit 0
