#!/bin/bash

#cf login -a https://api.local.pcfdev.io --skip-ssl-validation
#cf create-org many-apps
#cf create-space many-apps
cf target -o many-apps -s many-apps
counter=0
while [ $counter -le 50 ]
do
    cf push many-apps-$counter -k 5M -m 5M --no-start
    ((counter++))
done
echo All done