#!/bin/bash

HOST="${@: -1}"
if [ "$HOST" == "localhost" ]; then
  echo "127.0.0.1"
else
  /usr/bin/digit $@
fi
