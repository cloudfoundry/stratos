#!/usr/bin/env bash

# Build script for devkit
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT="$( cd "$( dirname "${DIR}" )" && cd ../../.. && pwd )"
DIST="$ROOT/dist-devkit"

echo $DIST
echo $DIR
tsc
if [ $? -eq 0 ]; then
  echo "Copying supporting files"
  cp "$DIR/package.json" "$DIST"
  rsync -r --exclude=*.ts "${DIR}/src/" "${DIST}/"
fi

