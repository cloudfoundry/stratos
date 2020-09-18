#!/bin/bash

# Check Stratos docker images are less than a day old (i.e. nightly pipelines are running)

CURRENT=$(date +%s)
CYAN="\e[36m"
RESET="\e[0m"

# Seconds in a day
MAX_AGE=86400
ERROR=false

TAG=nightly

function show_time () {
    num=$1
    min=0
    hour=0
    day=0
    if((num>59));then
        ((sec=num%60))
        ((num=num/60))
        if((num>59));then
            ((min=num%60))
            ((num=num/60))
            if((num>23));then
                ((hour=num%24))
                ((day=num/24))
            else
                ((hour=num))
            fi
        else
            ((min=num))
        fi
    else
        ((sec=num))
    fi
    AGE="${day}d ${hour}h ${min}m ${sec}s"
}

function check_image () {
  IMAGE=$1
  URL=https://hub.docker.com/v2/repositories/$IMAGE/tags/$TAG
  INFO=`curl -s -L "$URL"`  
  LAST_UPDATED=$(echo $INFO | jq -r ".last_updated")
  echo $LAST_UPDATED
  IMAGE_DATE=$(date -d "$LAST_UPDATED" +%s)
  DIFF=`expr $CURRENT - $IMAGE_DATE`
  show_time $DIFF
  AGE=$AGE
  #echo "Image: $IMAGE : Age: $AGE"
  printf "Image: $CYAN%-32s$RESET : Age: $CYAN$AGE$RESET\n" $IMAGE 

  if (( $DIFF > $MAX_AGE )); then
    echo "Image is too old"
    ERROR=true
  fi
}

echo "Checking Stratos nightly docker image builds have run"

# Images
check_image "splatform/stratos-console"
check_image "splatform/stratos-mariadb"
check_image "splatform/stratos-jetstream"
check_image "splatform/stratos-postflight-job"

# All-in-one
check_image "splatform/stratos"

if [ $ERROR == "true" ]; then
  echo "One or more images are out of date"
  exit 1
fi

