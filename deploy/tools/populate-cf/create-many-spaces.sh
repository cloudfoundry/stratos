#!/bin/bash
CREATE=true
ORG=many-spaces
SPACE_PREFIX=many-spaces
COUNT=10
APP_COUNT=0
APP_ROUTES=0
DOMAIN=d

while getopts o:s:c:a:r:d: option
do
 case "${option}"
 in
 o) ORG=${OPTARG};;
 s) SPACE_PREFIX=${OPTARG};;
 c) COUNT=${OPTARG};;
 a) APP_COUNT=${OPTARG};;
 r) APP_ROUTES=${OPTARG};;
 d) DOMAIN=${OPTARG};;
 esac
done

if [ "$CREATE" = true ]; then
    cf create-org $ORG
fi
cf target -o $ORG

counter=0
while [ $counter -le $COUNT ]
do
    SPACE=$SPACE_PREFIX-$counter
    cf create-space $SPACE
    ((counter++))
    ./create-many-apps.sh -o "$ORG" -s "$SPACE" -a "$SPACE-app-" -c $APP_COUNT -r "false" -r $APP_ROUTES -d "$DOMAIN"
done
echo "Created $COUNT spaces with '$APP_COUNT' apps in org '$ORG'"