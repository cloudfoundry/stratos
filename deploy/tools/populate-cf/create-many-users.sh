#!/bin/bash
CREATE=true
COUNT=90
ORG=many-users
ORG_USERS=70
SPACE=many-users
SPACE_USERS=50
USER_PREFIX=many-users
DELETE=false

while getopts o:p:s:t:c:r: option
do
 case "${option}"
 in
 o) ORG=${OPTARG};;
 p) ORG_USERS=${OPTARG};;
 s) SPACE=${OPTARG};;
 t) SPACE_USERS=${OPTARG};;
 c) COUNT=${OPTARG};;
 r) CREATE=${OPTARG};;
 esac
done

if [ "$DELETE" = true ]; then
    counter=0
    COUNT=$(expr $COUNT - 1)
    while [ $counter -le $COUNT ]
    do
        USERNAME=$USER_PREFIX-$counter
        PASSWORD=USERNAME
        echo counter $counter
        cf delete-user $USERNAME -f
        ((counter++))
    done
    cf delete-org $ORG -f
    exit 0
fi

echo "Creating $COUNT users in org '$ORG' ($ORG_USERS roles) and space '$SPACE' ($SPACE_USERS roles)"

if [ "$CREATE" = true ]; then
    cf create-org $ORG
    cf target -o $ORG
    cf create-space $SPACE
fi

cf target -o $ORG -s $SPACE

counter=0
COUNT=$(expr $COUNT - 1)
while [ $counter -le $COUNT ]
do
    USERNAME=$USER_PREFIX-$counter
    PASSWORD=USERNAME
    # echo counter $counter
    cf create-user $USERNAME $PASSWORD

    if [ $counter -lt $ORG_USERS ]; then
      #  echo Adding to Org $counter $ORG_USERS
       cf set-org-role $USERNAME $ORG BillingManager
    fi

    if [ $counter -lt $SPACE_USERS ]; then
      #  echo Adding to Space  $counter $SPACE_USERS
       cf set-space-role $USERNAME $ORG $SPACE SpaceDeveloper
    fi

    ((counter++))
done
echo "Created $(expr $COUNT + 1) users in org '$ORG' and space '$SPACE'"