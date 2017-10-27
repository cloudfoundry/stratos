#!/bin/bash
set -e

function execStatement {
    stmt=$1

    if [ "$DATABASE_PROVIDER" = "mysql" ]; then
        echo "Executing: mysql -u $DB_ADMIN_USER -h $DB_HOST -P $DB_PORT -p$DB_ADMIN_PASSWORD -e $stmt"
        mysql -u $DB_ADMIN_USER -h $DB_HOST -P $DB_PORT -p$DB_ADMIN_PASSWORD -e $stmt
    fi

    if [ "$DATABASE_PROVIDER" = "pgsql" ]; then
        echo "Executing:  PGPASSFILE=/tmp/pgpass psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d postgres -w -tc \"$stmt\""
        PGPASSFILE=/tmp/pgpass psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d postgres -w -tc "$stmt"
    fi
}

if [ "$DATABASE_PROVIDER" = "pgsql" ]; then
    # Save the superuser info to file to ensure secure access
    echo "*:$DB_PORT:postgres:$DB_USER:$(cat $DB_PASSWORD_FILE)" > /tmp/pgpass
    echo "*:$DB_PORT:$DB_DATABASE_NAME:$DB_USER:$(cat $DB_PASSWORDFILE)" >> /tmp/pgpass
    chmod 0600 /tmp/pgpass
    stratosDbExists=$(execStatement "SELECT 1 FROM pg_database WHERE datname = '$DB_DATABASE_NAME';")
    # Get db user password from secrets file
    DB_PASSWORD=$(cat $DB_PASSWORDFILE)
    DBCONF_KEY=k8s
fi

if [  "$DATABASE_PROVIDER" = "mysql" ]; then
    echo "DB Provider is MYSQL"
    stratosDbExists=$(execStatement  "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '$DB_DATABASE_NAME';")
    DBCONF_KEY=mariadb-k8s
fi

# Create DB if neccessary
if [ -z "$stratosDbExists" ] ; then
    echo "Creating database $DB_DATABASE_NAME"
    execStatement "CREATE DATABASE \"$DB_DATABASE_NAME\";"
    echo "Creating user $DB_USER"
    if [ "$DATABASE_PROVIDER" = "pgsql" ]; then
        execStatement "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';"
    fi
    if [ "$DATABASE_PROVIDER" = "mysql" ]; then
        execStatement "CREATE USER $DB_USER IDENTIFIED BY '$DB_PASSWORD';"
    fi
    
    echo "Granting privs for $DB_DATABASE_NAME to $DB_USER"
    execStatement "GRANT ALL PRIVILEGES ON DATABASE \"$DB_DATABASE_NAME\" TO $DB_USER;"
else
    echo "$DB_DATABASE_NAME already exists"
fi

# Migrate the database if necessary
echo "Checking database to see if migration is necessary."

echo "DBCONFIG: $DBCONF_KEY"
echo "Connection string: $DB_USER:$DB_PASSWORD@tcp($DB_HOST:$DB_PORT)/$DB_DATABASE_NAME?parseTime=true"
# Check the version
echo "Checking database version."
goose --env=$DBCONF_KEY dbversion

# Check the status
echo "Checking database status."
goose --env=$DBCONF_KEY status

# Run migrations
echo "Attempting database migrations."
goose --env=$DBCONF_KEY up

# CHeck the status
echo "Checking database status."
goose --env=$DBCONF_KEY status

# Check the version
echo "Checking database version."
goose --env=$DBCONF_KEY dbversion

echo "Database operation(s) complete."


TEMP_SCRIPT=$(mktemp)
cat << EOF >> $TEMP_SCRIPT
#!/bin/sh
# Check if Upgrade Lock file exists
while [ ! -f "/$UPGRADE_VOLUME/$UPGRADE_LOCK_FILENAME" ];
do 
    echo "Upgrade lock file does not exist yet! Sleeping..."
    sleep 5; 
done   
EOF
chmod +x $TEMP_SCRIPT

timeout 5m ${TEMP_SCRIPT}
# Remove the lock file on the shared volume
echo "Removing the $UPGRADE_LOCK_FILENAME file from the shared upgrade volume $UPGRADE_VOLUME."
rm /$UPGRADE_VOLUME/$UPGRADE_LOCK_FILENAME || true

echo "Removed the upgrade lock file."

# If DO_NOT_QUIT is set, don't quit script
# This is only used in toy kubernetes deployments with no shared volume 
if [ "${DO_NOT_QUIT:-false}" = "false" ]; then
    echo "Running in shared volume mode, exiting..."
    exit 0
else
    echo "Running in 'DO NOT QUIT' mode"
    while true; do sleep 5; done   
fi
