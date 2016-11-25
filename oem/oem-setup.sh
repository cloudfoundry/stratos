#!/bin/bash

# Script to apply branding to a console ui dist folder

# Need brand folder and output folder

echo $@
red=`tput setaf 1`
green=`tput setaf 2`
orange=`tput setaf 3`
cyan=`tput setaf 6`
reset=`tput sgr0`

#if [ $# -eq 0 ]; then
#  echo "${red}Need HCP version number to install${reset}"
#  exit 1
#fi

BRAND_FOLDER=examples/suse
DEST_FOLDER=../dist
BASE_CONSOLE_IMAGE=stackato/hsc-console:latest

while getopts ":b:d:pst:c:" opt ; do
    case $opt in
        b)
            BRAND_FOLDER=${OPTARG}
            ;;
        d)
            DEST_FOLDER=${OPTARG}
            ;;
        p)
            PRODUCE_PRODUCT_STRINGS_FILE=true
            ;;
        s)
            GENERATE_PATCH_SCRIPT=true
            ;;
        c)
            BASE_CONSOLE_IMAGE=${OPTARG}
            ;;
        \?)
            echo "Invalid option -$OPTARG" >&2
            usage
            ;;
    esac
done


echo "${cyan}Stackato Console Branding Setup${reset}"
echo "Using brand folder ${BRAND_FOLDER}"

echo "Applying Brand Product Strings"

CONFIG_FILE=${DEST_FOLDER}/stackato-config.js

# Format product strings onto one line without any line feeds/carriage returns
PS_REGEX=""
PRODUCT_STRINGS=$(jq . -c -j ${BRAND_FOLDER}/product_strings.json)

if [ ! -z ${PRODUCE_PRODUCT_STRINGS_FILE} ]; then
  echo "${cyan}Outputting product_strings file${reset}"
  echo ${PRODUCT_STRINGS} > ${DEST_FOLDER}/product_strings
else
  echo "${cyan}Running SED instruction${reset}"
  # Replace inline in the config.js file
  sed -i 's#,PRODUCT_STRINGS:.*};#,PRODUCT_STRINGS:'"$PRODUCT_STRINGS"'};#g' ${CONFIG_FILE}
fi

FAVICON="favicon.ico"

mkdir -p ${DEST_FOLDER}/images

if [ -f ${BRAND_FOLDER}/${FAVICON} ]; then
  echo "Copying brand favicon"
  cp -f ${BRAND_FOLDER}/${FAVICON} ${DEST_FOLDER}/images
fi

if [ -d ${BRAND_FOLDER}/images ]; then
  echo "Copying brand images"
  cp -rf ${BRAND_FOLDER}/images/*.* ${DEST_FOLDER}/images
fi

echo "Compiling stylesheet"

rm -rf ./tmp
mkdir ./tmp

if [ -f ${BRAND_FOLDER}/brand.scss ]; then
  echo "@import \"${BRAND_FOLDER}/brand.scss\";" >> ./tmp/index.scss
fi

echo "@import \"../scss/index.scss\";" >> ./tmp/index.scss

gulp oem
cp ./tmp/index.css ${DEST_FOLDER}

if [ ! -z ${GENERATE_PATCH_SCRIPT} ]; then

  #Output Dockerfile
  echo "" > ${DEST_FOLDER}/Dockerfile
  cat << EOF >> ${DEST_FOLDER}/Dockerfile
FROM ${BASE_CONSOLE_IMAGE}
ADD index.css /usr/share/nginx/html/index.css
ADD images /usr/share/nginx/html/images
ADD product_strings /tmp
RUN PRODUCT_STRINGS=\$(cat /tmp/product_strings) && \
 sed -i 's#,PRODUCT_STRINGS:.*};#,PRODUCT_STRINGS:'"\$PRODUCT_STRINGS"'};#g' usr/share/nginx/html/stackato-config.js
EOF
fi
