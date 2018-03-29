#!/bin/bash

#cf login -a https://api.local.pcfdev.io --skip-ssl-validation
#cf create-org many-spaces
cf target -o many-spaces
counter=0
while [ $counter -le 50 ]
do
    cf create-space many-spaces-$counter
    ((counter++))
done
echo All done