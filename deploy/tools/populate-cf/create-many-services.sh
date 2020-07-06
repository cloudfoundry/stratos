#!/bin/bash
CREATE="true"
ORG=many-apps
SPACE=many-apps
SERVICE_PREFIX=many-services-
COUNT=10
SERVICE=
SERVICE_PLAN=

while getopts o:s:a:c:e:v:i: option
do
 case "${option}"
 in
 o) ORG=${OPTARG};;
 s) SPACE=${OPTARG};;
 a) SERVICE_PREFIX=${OPTARG};;
 c) COUNT=${OPTARG};;
 e) CREATE=${OPTARG};;
 v) SERVICE=${OPTARG};;
 i) SERVICE_PLAN=${OPTARG};;
 esac
done

echo $SERVICE
echo $SERVICE_PLAN

echo "Creating $COUNT service instances in org '$ORG' space '$SPACE'"

if [ "$CREATE" = "true" ]; then
    cf create-org $ORG
fi
cf target -o $ORG

if [ "$CREATE" = "true" ]; then
    cf create-space $SPACE
fi
cf target -s $SPACE

counter=0
COUNT=$(expr $COUNT - 1)
while [ $counter -le $COUNT ]
do
    cf create-service "$SERVICE" "$SERVICE_PLAN" "$SERVICE_PREFIX-$counter"
    ((counter++))
done
echo "Created $counter service instances in org '$ORG' space '$SPACE'"