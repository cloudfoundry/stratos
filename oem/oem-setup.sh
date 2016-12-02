#!/bin/bash

# Script to apply branding to a console ui dist folder
# Need brand folder and output folder

red=`tput setaf 1`
green=`tput setaf 2`
orange=`tput setaf 3`
cyan=`tput setaf 6`
reset=`tput sgr0`

BRAND_FOLDER=brands/suse
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
echo "Using brand folder ${green}${BRAND_FOLDER}${reset}"

CONFIG_FILE=${DEST_FOLDER}/stackato-config.js
INDEX_HTML=${DEST_FOLDER}/index.html
FAVICON="favicon.ico"

mkdir -p ${DEST_FOLDER}/images
rm -rf ./tmp
mkdir ./tmp

# Process OEM Configuraion file if present
if [ -f ${BRAND_FOLDER}/oem_config.json ]; then
    echo "Copying OEM Configuration File"
    cp ${BRAND_FOLDER}/oem_config.json ./tmp
else
    echo "${orange}No OEM Configuration File detected${reset}"
    echo "{}" > ./tmp/oem_config.json
fi

if [ -f ${BRAND_FOLDER}/${FAVICON} ]; then
  echo "Copying favicon"
  cp -f ${BRAND_FOLDER}/${FAVICON} ${DEST_FOLDER}/images
else
    echo "${orange}No favicon supplied${reset}"
fi

if [ -d ${BRAND_FOLDER}/images ]; then
    echo "Copying images"
  cp -rf ${BRAND_FOLDER}/images/*.* ${DEST_FOLDER}/images 2>/dev/null
else
    echo "${orange}No imaegs supplied${reset}"
fi

if [ -d ${BRAND_FOLDER}/html ]; then
    echo "Copying html templates"
    mkdir -p ${DEST_FOLDER}/html
  cp -rf ${BRAND_FOLDER}/html/*.* ${DEST_FOLDER}/html 2>/dev/null
else
    echo "No html templates supplied"
fi

if [ -f ${BRAND_FOLDER}/brand.scss ]; then
  echo "@import \"${BRAND_FOLDER}/brand.scss\";" >> ./tmp/index.scss
else
  echo "${orange}No stylesheet supplied${reset}"
fi

echo "@import \"../dist/scss/index.scss\";" >> ./tmp/index.scss

# Generate/patch required files
echo "Compiling stylesheet, generating index.html and stackato-config.js"
gulp oem
if [ $? -ne 0 ]; then
  echo "${red}Error generating files${reset}"
fi

# Copy generated/patched files to the dest folder
cp ./tmp/index.css ${DEST_FOLDER}
cp ./tmp/stackato-config.js ${DEST_FOLDER}
cp ./tmp/index.html ${DEST_FOLDER}

if [ ! -z ${GENERATE_PATCH_SCRIPT} ]; then

  #Output Dockerfile
  echo "" > ${DEST_FOLDER}/Dockerfile
  cat << EOF >> ${DEST_FOLDER}/Dockerfile
FROM ${BASE_CONSOLE_IMAGE}
ADD index.css /usr/share/nginx/html/index.css
ADD images /usr/share/nginx/html/images
ADD html /usr/share/nginx/html/html
ADD stackato-config.js /usr/share/nginx/html
ADD index.html /usr/share/nginx/html
EOF
fi
