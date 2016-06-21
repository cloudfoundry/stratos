#!/bin/bash

TOOLSDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MAINDIR="$( cd "$( dirname "${TOOLSDIR}" )" && pwd )"

pushd "${MAINDIR}"

source postgres.env

docker-compose -f docker-compose.development.yml exec postgres psql -U $POSTGRES_USER -d $POSTGRES_DB

popd
