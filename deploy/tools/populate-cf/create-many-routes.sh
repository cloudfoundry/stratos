#!/bin/bash
CREATE=true
ORG=many-apps
SPACE=many-apps
APP=many-apps
ROUTE_PREFIX=many-routes-
COUNT=10
DOMAIN=domain

while getopts o:s:a:r:c:d: option 
do 
 case "${option}" 
 in 
 o) ORG=${OPTARG};; 
 s) SPACE=${OPTARG};; 
 a) APP=${OPTARG};; 
 r) ROUTE_PREFIX=${OPTARG};; 
 c) COUNT=${OPTARG};; 
 d) DOMAIN=${OPTARG};; 
 esac 
done 

counter=0
while [ $counter -le $COUNT ]
do
    cf map-route $APP $DOMAIN --hostname $ROUTE_PREFIX-$counter
    ((counter++))
done
echo "Created $COUNT routes in org '$ORG' space '$SPACE' app '$APP'"