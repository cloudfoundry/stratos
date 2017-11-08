#!/bin/bash

TOOLSDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MAINDIR="$( cd "$( dirname "${TOOLSDIR}" )" && pwd )"

pushd "${MAINDIR}"

source mariadb.env

docker-compose -f docker-compose.development.yml exec mariadb mysql -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE 

popd
