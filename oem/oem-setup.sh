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
            PRODUCE_OEM_CONFIG_FILE=true
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


CONFIG_FILE=${DEST_FOLDER}/stackato-config.js
INDEX_HTML=${DEST_FOLDER}/index.html

PS_REGEX=""

OEM_CONFIG="{}"

# Process OEM Configuraion file if present
if [ -f ${BRAND_FOLDER}/oem_config.json ]; then
    echo "Applying OEM Configuration File"
    # Format OEM Configuration onto one line without any line feeds/carriage returns
    OEM_CONFIG=$(cat ${BRAND_FOLDER}/oem_config.json | jq . -c -j)
    PRODUCT_NAME=$(cat ${BRAND_FOLDER}/oem_config.json | jq -c -j '.PRODUCT_NAME')
else
    echo "${orange}No OEM Configuration File detected${reset}"
fi

if [ "${PRODUCT_NAME}" == "null" ]; then
    PRODUCT_NAME="Console"
    echo "${red}Product Name is not set in the OEM Configuration file - please set this"
else
    echo "Product Name is: ${green}${PRODUCT_NAME}${reset}"
fi

if [ ! -z ${PRODUCE_OEM_CONFIG_FILE} ]; then
    echo "${cyan}Outputting oem_config file${reset}"
    echo ${OEM_CONFIG} > ${DEST_FOLDER}/oem_config
    echo ${PRODUCT_NAME} > ${DEST_FOLDER}/product_name
else
    echo "${cyan}Running SED instruction${reset}"
    # Replace inline in the config.js file
    sed -i 's#,OEM_CONFIG:.*};#,OEM_CONFIG:'"$OEM_CONFIG"'};#g' ${CONFIG_FILE}
    # Replace title in index.html
    sed -i 's#<title>.*</title>#<title>'"$PRODUCT_NAME"'</title>#g' ${INDEX_HTML}
fi

FAVICON="favicon.ico"

mkdir -p ${DEST_FOLDER}/images

if [ -f ${BRAND_FOLDER}/${FAVICON} ]; then
  echo "Copying favicon"
  cp -f ${BRAND_FOLDER}/${FAVICON} ${DEST_FOLDER}/images
else
    echo "${orange}No favicon supplied${reset}"
fi

if [ -d ${BRAND_FOLDER}/images ]; then
    echo "Copying images"
  cp -rf ${BRAND_FOLDER}/images/*.* ${DEST_FOLDER}/images
else
    echo "${orange}No imaegs supplied${reset}"
fi


rm -rf ./tmp
mkdir ./tmp

if [ -f ${BRAND_FOLDER}/brand.scss ]; then
  echo "Compiling stylesheet"
  echo "@import \"${BRAND_FOLDER}/brand.scss\";" >> ./tmp/index.scss
else
  echo "${orange}No stylesheet supplied${reset}"
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
ADD oem_config /tmp
ADD product_name /tmp
RUN OEM_CONFIG=\$(cat /tmp/oem_config) && \
 sed -i 's#,OEM_CONFIG:.*};#,OEM_CONFIG:'"\$OEM_CONFIG"'};#g' usr/share/nginx/html/stackato-config.js && \
 PRODUCT_NAME=\$(cat /tmp/product_name) && \
 sed -i 's#<title>.*</title>#<title>'"$PRODUCT_NAME"'</title>#g' usr/share/nginx/html/index.html
EOF
fi
