# ./create-many-apps.sh -o "aamany-apps-1" -s "aamany-apps-1" -a "many-apps-set1" -c 3 -r "false"
# ./create-many-apps.sh -o "many-apps-1" -s "many-apps-1" -a "many-apps-set1" -c 1 -r 2 -d "local.pcfdev.io"
# ./create-many-apps.sh -o "many-apps-1" -s "many-apps-2" -a "many-apps-set2" -c 3
# ./create-many-apps.sh -o "many-apps-2" -s "many-apps-1" -a "many-apps-set3" -c 3
# ./create-many-apps.sh -o "many-apps-2" -s "many-apps-2" -a "many-apps-set4" -c 3


# ./create-many-services.sh -o "many-spaces" -s "many-spaces" -a "many-services" -c 2 -e true -v "local-volume" -i "free-local-disk"


./create-many-spaces.sh -o "many-spaces" -s "many-spaces" -c 1 -a 1 -r 1 -d "local.pcfdev.io" -j 1 -v "local-volume" -i "free-local-disk"

# ./create-many-routes.sh  -o "many-apps-1" -s "many-apps-1" -a "many-apps-set1-0" -r "many-routes" -c 3 -d "local.pcfdev.io"