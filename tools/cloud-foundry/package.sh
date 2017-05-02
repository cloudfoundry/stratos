#!/bin/bash

bold=`tput bold`
red=`tput setaf 1`
green=`tput setaf 2`
orange=`tput setaf 3`
cyan=`tput setaf 6`
reset=`tput sgr0`

printf "${bold}Preparing application folder for Cloud Foundry deployment${reset}\n\n"

# First arg is the path to thr portal-proxy code
# If not set, then we will look in GOPATH

# Need first arg which is the dir of the UI code

if [ -z "$1" ]; then
  # Need to GOPATH
  if [ -z "$GOPATH" ]; then
    echo "Need folder path to the UI codebase or GOPATH needs to be set"
    exit 1
  fi
  BACK_END_DIR=$GOPATH/src/github.com/hpcloud/portal-proxy
else
  BACK_END_DIR=$1
fi

if [ "$(uname -o)" == "Msys" ]; then
  BACK_END_DIR=$(cygpath $BACK_END_DIR)
fi

# Check that the portal proxy folder exists
if [ ! -d "$BACK_END_DIR" ]; then
  echo "Can not find portal proxy folder: ${BACK_END_DIR}"
fi

UI_DIR=$1
CF_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Output will go in the top-level out folder in a sub-folder
DIST=${CF_DIR}/../../out/cloud-foundry

echo "Preparing application in folder ${bold}${cyan}$(realpath ${DIST})${reset}"

echo "Building UI....."
#./provision.sh
gulp

printf "\n${green}${bold}OK${reset}\n\n"

# Ensure the dist folder exists and is empty
if [ -d "$DIST" ]; then
  rm -rf ${DIST}/*
else
  mkdir -p ${DIST}
fi

echo "Copying back-end code to dist folder"
cp ${BACK_END_DIR}/*.* ${DIST}

skip=(dist vendor containers tools scripts)

for dir in ${BACK_END_DIR}/*/ ; do
  #echo "$dir"
  name=$(basename "${dir}")
  if [[ ! ${skip[*]}] =~  "${name}" ]] ; then
    echo "Copying: $name"
    mkdir -p ${DIST}/${name}
    cp -R $dir ${DIST}
  fi
done

rm -f ${DIST}/Dockerfile.*
rm -f ${DIST}/*_test.go
rm -f ${DIST}/README.md
rm -f ${DIST}/*.sample
rm -f ${DIST}/*.goconvey
rm -f ${DIST}/*.iml
rm -f ${DIST}/*.db

echo "Copying UI into back-end UI folder"

mkdir ${DIST}/ui
cp -R ./dist/* ${DIST}/ui

# Copy the config file
cp ${CF_DIR}/config.properties ${DIST}

# Copy the manifest file
cp ${CF_DIR}/manifest.yml ${DIST}

# Remove the build portal-proxy binary
rm -rf ${DIST}/portal-proxy
rm -rf ${DIST}/portal-proxy.exe

#tar -zcvf ${DIST}/../cf-console.tar.gz ${DIST} --transform s/dist/cf-console/

printf "${bold}All done${reset}\n"
