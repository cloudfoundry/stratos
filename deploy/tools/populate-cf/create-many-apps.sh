#!/bin/bash
CREATE=true
ORG=many-apps
SPACE=many-apps
APP_PREFIX=many-apps
COUNT=10
ROUTES=0
DOMAIN=d

while getopts o:s:a:c:e:r:d: option
do
 case "${option}"
 in
 o) ORG=${OPTARG};;
 s) SPACE=${OPTARG};;
 a) APP_PREFIX=${OPTARG};;
 c) COUNT=${OPTARG};;
 e) CREATE=${OPTARG};;
 r) ROUTES=${OPTARG};;
 d) DOMAIN=${OPTARG};;
 esac
done

# cf login -a https://api.local.pcfdev.io --skip-ssl-validation
if [ "$CREATE" = true ]; then
    cf create-org $ORG
fi
cf target -o $ORG

if [ "$CREATE" = true ]; then
    cf create-space $SPACE
fi
cf target -s $SPACE

counter=0
while [ $counter -le $COUNT ]
do
    APP=$APP_PREFIX-$counter
    cf push $APP -k 5M -m 5M --no-start
    ./create-many-routes.sh  -o "$ORG" -s "$SPACE" -a "$APP" -r "$APP-route" -c $ROUTES -d "$DOMAIN"
    ((counter++))
done
echo "Created $COUNT apps in org '$ORG' space '$SPACE'"