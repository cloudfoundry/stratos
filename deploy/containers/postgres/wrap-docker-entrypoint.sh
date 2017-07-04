#!/bin/bash
set -e

# Wrap the standard postgres containers entrypoint, without replacing it,
# in order to support reading a password from a file on disk, rather than
# from an environment variable.

# TODO: Push this change upstream and remove me.

if [ -f $POSTGRES_PASSWORD_FILE ]; then
  export POSTGRES_PASSWORD=`cat $POSTGRES_PASSWORD_FILE`
fi

exec /docker-entrypoint.sh "$@"
