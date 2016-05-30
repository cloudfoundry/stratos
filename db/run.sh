#!/bin/sh
set -e

execStatement() {
    stmt=$1
    PGPASSWORD='stolon' psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -w -tc "$stmt"
}

execStatementsFromFile() {
    file=$1
    PGPASSWORD='stratos' psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $STRATOS_DB -w -f "$file"
}

echo "$DB_HOST:$DB_PORT:$DB:$DB_USER:$(cat $DB_PW_FILE)" > /tmp/pgpass
chmod 0600 /tmp/pgpass

stratosExists=$(execStatement "SELECT 1 FROM pg_database WHERE datname = '$STRATOS_DB';")
if [ -z "$stratosExists" ] ; then
    execStatement "CREATE DATABASE $STRATOS_DB;"
    execStatement "CREATE USER $STRATOS_USER WITH ENCRYPTED PASSWORD '$STRATOS_PWD';"
    execStatement "GRANT ALL PRIVILEGES ON DATABASE $STRATOS_PWD TO $STRATOS_USER;"
    execStatementsFromFile "$SQL"
else
    echo "$STRATOS_DB already exists"
fi

exit 0
