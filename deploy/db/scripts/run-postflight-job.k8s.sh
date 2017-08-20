#!/bin/sh
set -e

execStatement() {
    stmt=$1
    PGPASSFILE=/tmp/pgpass psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d postgres -w -tc "$stmt"
}

# Save the superuser info to file to ensure secure access
echo "*:$DB_PORT:postgres:$DB_USER:$(cat $DB_PASSWORD_FILE)" > /tmp/pgpass
echo "*:$DB_PORT:$DB_DATABASE_NAME:$DB_USER:$(cat $DB_PASSWORDFILE)" >> /tmp/pgpass
chmod 0600 /tmp/pgpass

# Get db user password from secrets file
PWD=$(cat $DB_PASSWORDFILE)

# Create the database if necessary
stratosDbExists=$(execStatement "SELECT 1 FROM pg_database WHERE datname = '$DB_DATABASE_NAME';")
if [ -z "$stratosDbExists" ] ; then
    echo "Creating database $DB_DATABASE_NAME"
    execStatement "CREATE DATABASE \"$DB_DATABASE_NAME\";"
    echo "Creating user $DB_USER"
    execStatement "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$PWD';"
    echo "Granting privs for $DB_DATABASE_NAME to $DB_USER"
    execStatement "GRANT ALL PRIVILEGES ON DATABASE \"$DB_DATABASE_NAME\" TO $DB_USER;"
else
    echo "$DB_DATABASE_NAME already exists"
fi

# Migrate the database if necessary
echo "Checking database to see if migration is necessary."

# Check the version
echo "Checking database version."
DB_PASSWORD=$PWD goose --env=k8s dbversion

# Check the status
echo "Checking database status."
DB_PASSWORD=$PWD goose --env=k8s status

# Run migrations
echo "Attempting database migrations."
DB_PASSWORD=$PWD goose --env=k8s up

# CHeck the status
echo "Checking database status."
DB_PASSWORD=$PWD goose --env=k8s status

# Check the version
echo "Checking database version."
DB_PASSWORD=$PWD goose --env=k8s dbversion

echo "Database operation(s) complete."


# Check if Upgrade Lock file exists
if [ ! -f "/$UPGRADE_VOLUME/$UPGRADE_LOCK_FILENAME" ]; then
  exit 1
fi
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
    while true; do echo ''; sleep 5; done   
fi
