#!/bin/bash
CREATE_ORG_SPACE="true"
ORG=many-spaces
SPACE_PREFIX=many-spaces
COUNT=10
APP_COUNT=0
APP_ROUTES=0
DOMAIN=d
SERVICE_COUNT=0
SERVICE=
SERVICE_PLAN=

while getopts o:p:s:c:a:r:d:j:v:i: option
do
 case "${option}"
 in
 o) ORG=${OPTARG};;
 p) CREATE_ORG_SPACE=${OPTARG};;
 s) SPACE_PREFIX=${OPTARG};;
 c) COUNT=${OPTARG};;
 a) APP_COUNT=${OPTARG};;
 r) APP_ROUTES=${OPTARG};;
 d) DOMAIN=${OPTARG};;
 j) SERVICE_COUNT=${OPTARG};;
 v) SERVICE=${OPTARG};;
 i) SERVICE_PLAN=${OPTARG};;
 esac
done

echo "Creating $COUNT spaces with '$APP_COUNT' apps in org '$ORG'"


if [ "$CREATE_ORG_SPACE" = "true" ]; then
    cf create-org $ORG
fi
cf target -o $ORG

counter=0
COUNT=$(expr $COUNT - 1)
while [ $counter -le $COUNT ]
do
    SPACE=$SPACE_PREFIX-$counter
    cf create-space $SPACE
    ((counter++))
    SERVICE_INSTANCE="$SPACE-si"
    if [ -n "$SERVICE" ]; then
      ./create-many-services.sh -o "$ORG" -s "$SPACE" -a "$SERVICE_INSTANCE" -c $SERVICE_COUNT -e false -v "$SERVICE" -i "$SERVICE_PLAN"
    fi
    ./create-many-apps.sh -o "$ORG" -s "$SPACE" -a "$SPACE-app-" -c $APP_COUNT -r "false" -r $APP_ROUTES -d "$DOMAIN" -v "$SERVICE_INSTANCE-0" -e $CREATE_ORG_SPACE
done
echo "Created $counter spaces with '$APP_COUNT' apps in org '$ORG'"