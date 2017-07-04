#!/bin/bash
set -e

# Check the version
echo "Checking database version."
$GOPATH/bin/goose --env=development dbversion

# Check the status
echo "Checking database status."
$GOPATH/bin/goose --env=development status

# Run migrations
echo "Attempting database migrations."
$GOPATH/bin/goose --env=development up

# CHeck the status
echo "Checking database status."
$GOPATH/bin/goose --env=development status

# Check the version
echo "Checking database version."
$GOPATH/bin/goose --env=development dbversion

echo "Database operation(s) complete."

exit 0
