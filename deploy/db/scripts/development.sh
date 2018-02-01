#!/bin/bash
set -e

# Check the version
echo "Checking database version."
./stratos-dbmigrator --env=mariadb-development dbversion

EXITVAL=$?
while [ $EXITVAL -ne 0 ]
do
  echo "Failed to execute dbversion check, retrying after one second"
  sleep 1
  ./stratos-dbmigrator --env=mariadb-development dbversion
  EXITVAL=$?
done

# Check the status
echo "Checking database status."
./stratos-dbmigrator --env=mariadb-development status

# Run migrations
echo "Attempting database migrations."
./stratos-dbmigrator --env=mariadb-development up

# CHeck the status
echo "Checking database status."
./stratos-dbmigrator --env=mariadb-development status

# Check the version
echo "Checking database version."
./stratos-dbmigrator --env=mariadb-development dbversion

echo "Database operation(s) complete."

exit 0
