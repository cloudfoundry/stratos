#!/bin/bash

ORG_PREFIX=many-orgs
COUNT=10
SPACE_COUNT=
DELETE=false

while getopts o:c:s:d: option
do
 case "${option}"
 in
 o) ORG_PREFIX=${OPTARG};;
 c) COUNT=${OPTARG};;
 s) SPACE_COUNT=${OPTARG};;
 d) DELETE=${OPTARG};;
 esac
done

echo "Creating $COUNT orgs with $SPACE_COUNT spaces"

counter=14
COUNT=$(expr $COUNT - 1)
while [ $counter -le $COUNT ]
do
    ORG=$ORG_PREFIX-$counter
    if [ "$DELETE" == "true" ]; then
      cf delete-org $ORG -f
    else
      # echo "CREATE $ORG"
      cf create-org $ORG
    fi
    
    if [ "$SPACE_COUNT" != "" ]; then
      cf target -o $ORG
      ./create-many-spaces.sh -o "$ORG" -s "$ORG-spaces" -c $SPACE_COUNT -a 0 -r 0 -p "false"
    fi
    ((counter++))
  
done
echo "Created $counter orgs with $SPACE_COUNT spaces"
