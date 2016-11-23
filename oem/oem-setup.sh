#!/bin/bash

# Script to apply branding to a console ui dist folder

# Need brand folder and output folder

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

if [ -n "$1" ]; then
  BRAND_FOLDER=$1
fi

echo "${cyan}Stackato Console Branding Setup${reset}"
echo "Using brand folder ${BRAND_FOLDER}"

echo "Applying Brand Product Strings"

CONFIG_FILE=${DEST_FOLDER}/stackato-config.js

# Format product strings onto one line without any line feeds/carriage returns
PS_REGEX=""
PRODUCT_STRINGS=$(jq . -c -j ${BRAND_FOLDER}/product_strings.json)

# Replace inline in the config.js file
sed -i 's/PRODUCT_STRINGS:.*}};/PRODUCT_STRINGS:'"$PRODUCT_STRINGS"'};/g' ${CONFIG_FILE}  

FAVICON="favicon.ico"

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

#rm -rf tmp
