#!/usr/bin/env bash


function cleanUpBefore() (
  currentWebsite=$1

  rm -rf $currentWebsite/versioned_docs
  mkdir -p $currentWebsite/versioned_docs

  rm -rf $currentWebsite/versioned_sidebars
  mkdir -p $currentWebsite/versioned_sidebars

  echo "[]" > $currentWebsite/versions.json
) 

function gitClone() (
  rurl="$1" localdir="$2"
  echo Cloning from $rurl into $localdir
  git clone --depth 1 --no-single-branch $rurl $localdir
  pushd $localdir/website
  npm install
  popd
)

function createVersionedDocs() (
  echo Updating versioned docs folder
  checkedOutRepo=$1
  currentWebsite=$2
  label=$3
  
  mkdir -p $currentWebsite/versioned_docs
  cp -r $checkedOutRepo/website/versioned_docs/version-$label $currentWebsite/versioned_docs
)

function createVersiondSidebar() (
  echo Updating versioned sidebar
  checkedOutRepo=$1
  currentWebsite=$2
  label=$3
  
  mkdir -p $currentWebsite/versioned_sidebars
  cp $checkedOutRepo/website/versioned_sidebars/version-$label-sidebars.json $currentWebsite/versioned_sidebars
)

function updateVersionsFile() (
  echo Updating versions file from $1
  versions=${1::-1}\]
  echo to $versions
  echo $versions > $versionsFile
)

function cleanUpAfter() (
  rm -rf $tempDirForGit
) 


# wesbite folder
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

tempDirForGit=$(mktemp -d)#// TODO: RC FIX ME
# // TODO: RC Add script to build ? publish action
# tempDirForGit=$DIR/temp
# mkdir -p $tempDirForGit


gitUrl=$(git remote get-url origin)
versionsFile="versions.json"
internalVersionsFile="internal-versions.json"

echo ---------- Input  -------------
# echo Hashes to treat as version: $hashes
echo Temp Dir: $tempDirForGit. This will be removed
echo GIT Url: $gitUrl
echo Versions File: $versionsFile
echo Internal Versions File: $internalVersionsFile

gitClone $gitUrl $tempDirForGit #// TODO: RC

versions="["

cleanUpBefore $DIR


for row in $(jq -r '.[]' $internalVersionsFile); do
  IFS=: read versionsLabel versionsHash <<< $row

  if [ -z "$versionsLabel" ]; then
    echo Invalid row \(no version label\): $row 
    exit 1
  fi

  if [ -z "$versionsHash" ]; then
    echo Invalid row \(no version hash\): $row
    exit 1
  fi

  
  pushd $tempDirForGit
  git checkout $versionsHash
  pushd website
  npm run version -- $versionsLabel
  popd
  popd

  createVersionedDocs $tempDirForGit/ $DIR $versionsLabel
  createVersiondSidebar $tempDirForGit $DIR $versionsLabel
  versions=$versions\"$versionsLabel\",  

done

updateVersionsFile $versions
cleanUp $tempDirForGit  #// TODO: RC



