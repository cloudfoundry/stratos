#!/bin/bash

while getopts ":u:" opt; do
  case ${opt} in
    u )
        doclayer=$OPTARG
      ;;
    \? ) echo "Invalid option: $OPTARG" 1>&2
      ;;
    : )
      echo "$OPTARG requires a value set to the URL of the document layer." 1>&2
      ;;
  esac
done
shift $((OPTIND -1))

if [ -z "$doclayer" ];
then
    echo "--doclayer-url must be set." >&2
    exit 1
fi

/var/fdb/scripts/fdb.bash &
/var/fdb/scripts/fdbdoc.bash &
/chartrepo serve --doclayer-url=$doclayer &
./jetstream