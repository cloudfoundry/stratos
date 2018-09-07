#!/bin/bash
echo "=== Stratos Postlight Job ==="
echo "Running postflight job"

# mysql commands will timeout after 5 seconds
MYSQL_CMD="mysql -u $DB_ADMIN_USER -h $DB_HOST -P $DB_PORT -p$DB_ADMIN_PASSWORD --connect_timeout 5 -e"

echo "Checking if DB Server is ready"
dbServerVersion=$(${MYSQL_CMD} "SELECT VERSION();" --skip-column-names)
if [ $? -eq 1 ]; then
  echo "Failed to connect to database server - it is not ready yet .. bailing for now..."
  exit 1
fi

echo "Database Server is ready"
echo $dbServerVersion

set -e

echo "Checking if DB exists..."
stratosDbExists=$(${MYSQL_CMD}  "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '$DB_DATABASE_NAME';")
DBCONF_KEY=mariadb-k8s

# Create DB if neccessary
if [ -z "$stratosDbExists" ] ; then
    echo "Creating database $DB_DATABASE_NAME"
    ${MYSQL_CMD} "CREATE DATABASE \"$DB_DATABASE_NAME\";"
    echo "Creating user $DB_USER"
    ${MYSQL_CMD} "CREATE USER $DB_USER IDENTIFIED BY '$DB_PASSWORD';"
    echo "Granting privs for $DB_DATABASE_NAME to $DB_USER"
    ${MYSQL_CMD} "GRANT ALL PRIVILEGES ON DATABASE \"$DB_DATABASE_NAME\" TO $DB_USER;"
else
    echo "$DB_DATABASE_NAME already exists"
fi

# Migrate the database if necessary
echo "Checking database to see if migration is necessary."

echo "DBCONFIG: $DBCONF_KEY"
echo "Connection string: $DB_USER:********@tcp($DB_HOST:$DB_PORT)/$DB_DATABASE_NAME?parseTime=true"
# Check the version
echo "Checking database version."
jetstream --env=$DBCONF_KEY dbversion

# Check the status
echo "Checking database status."
jetstream --env=$DBCONF_KEY status

# Run migrations
echo "Attempting database migrations."
jetstream --env=$DBCONF_KEY up

# CHeck the status
echo "Checking database status."
jetstream --env=$DBCONF_KEY status

# Check the version
echo "Checking database version."
jetstream --env=$DBCONF_KEY dbversion

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
