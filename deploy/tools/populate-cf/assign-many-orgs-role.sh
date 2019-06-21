#!/bin/bash
USER=
ORG_PREFIX=many-orgs
COUNT=10

while getopts o:c:u: option
do
 case "${option}"
 in
 o) ORG_PREFIX=${OPTARG};;
 c) COUNT=${OPTARG};;
 u) USER=${OPTARG};;
 esac
done

echo "Assign roles to $COUNT orgs"

counter=0
COUNT=$(expr $COUNT - 1)
while [ $counter -le $COUNT ]
do
    ORG=$ORG_PREFIX-$counter
    cf set-org-role "$USER" "$ORG" "OrgManager"
    ((counter++))
  
done
echo "Assigned roles to $COUNT orgs"

