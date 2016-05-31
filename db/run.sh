#!/bin/bash
set -e

execStatement() {
    stmt=$1
    PGPASSFILE=/tmp/pgpass psql -U $POSTGRES_USER -h $DB_HOST -p $CFGDB_PORT -d $DB -w -tc "$stmt"
}

execStatementsFromFile() {
    file=$1
    PGPASSFILE=/tmp/pgpass psql -U $STRATOS_USER -h $DB_HOST -p $CFGDB_PORT -d $STRATOS_DB -w -f "$file"
}

echo "$DB_HOST:$CFGDB_PORT:$DB:$POSTGRES_USER:$POSTGRES_PASSWORD" > /tmp/pgpass
chmod 0600 /tmp/pgpass

stratosExists=$(execStatement "SELECT 1 FROM pg_database WHERE datname = '$STRATOS_DB';")
if [ -z "$stratosExists" ] ; then
    execStatement "CREATE DATABASE $STRATOS_DB;"
    execStatement "CREATE USER $STRATOS_USER WITH ENCRYPTED PASSWORD '$STRATOS_PWD';"
    execStatement "GRANT ALL PRIVILEGES ON DATABASE $STRATOS_DB TO $STRATOS_USER;"
    execStatementsFromFile "$SQL"
else
    echo "$STRATOS_DB already exists"
fi

echo "Success!"

exit 0
