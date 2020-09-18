#!/usr/bin/env bash
set -e
set -o pipefail

function logInner() (
  echo ..... $1
)

function cleanUpBefore() (
  currentWebsite=$1

  rm -rf $currentWebsite/versioned_docs
  mkdir -p $currentWebsite/versioned_docs

  rm -rf $currentWebsite/versioned_sidebars
  mkdir -p $currentWebsite/versioned_sidebars

  echo "[]" > $currentWebsite/versions.json

  cleanUpGit
) 

function gitClone() (
  rurl="$1" localdir="$2"
  echo "Cloning from $rurl into $localdir"
  # git clone --depth 1 --no-single-branch $rurl $localdir
  git clone $rurl $localdir
  pushd $localdir/website > /dev/null
  npm install
  popd > /dev/null
)

function checkoutAndTag() (
  logInner "Checking out: $versionsHash"
  pushd $tempDirForGit > /dev/null
  git checkout $versionsHash
  pushd website > /dev/null
  logInner "Tagging with version $versionsLabel"
  npm run version -- $versionsLabel
  popd > /dev/null
  popd > /dev/null
)

function createVersionedDocs() (
  logInner "Updating versioned docs folder"
  checkedOutRepo=$1
  currentWebsite=$2
  label=$3
  
  mkdir -p $currentWebsite/versioned_docs
  cp -r $checkedOutRepo/website/versioned_docs/version-$label $currentWebsite/versioned_docs
)

function createVersiondSidebar() (
  logInner "Updating versioned sidebar"
  checkedOutRepo=$1
  currentWebsite=$2
  label=$3
  
  mkdir -p $currentWebsite/versioned_sidebars
  cp $checkedOutRepo/website/versioned_sidebars/version-$label-sidebars.json $currentWebsite/versioned_sidebars
)

function updateVersionsFile() (
  vString=$1
  if [ $vString = "]" ]; then
    echo "No content for versions file"
    return
  fi
  echo Updating versions file from $vString
  versions="[${vString:1}"

  echo to $versions
  echo $versions > $versionsFile
)

function cleanUpGit() (
  echo Removing folder: $tempDirForGit 
  rm -rf $tempDirForGit
) 


# wesbite folder
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

# tempDirForGit=$(mktemp -d)
tempDirForGit=$DIR/versions-repo
mkdir -p $tempDirForGit

gitUrl=$(git remote get-url origin)
versionsFile="versions.json"
internalVersionsFile="internal-versions.json"

echo ---------- Values  -------------
# echo Hashes to treat as version: $hashes
echo Temp Dir: $tempDirForGit. This will be removed
echo GIT Url: $gitUrl
echo Versions File: $versionsFile
echo Internal Versions File: $internalVersionsFile
echo Current Directory: $DIR

cleanUpBefore $DIR

gitClone $gitUrl $tempDirForGit

versions="]"

internalVersions=$(jq -r '.[]' $internalVersionsFile)
export internalVersionsArray=($internalVersions)

# Loop through each version 
# .. checkout that version in the temp dir
# .. tag that version with it's label using docusaurus
# .. copy the files docusaurus creates back into the main repo
# .. store the label 
# The versions are reveresed, not so important at the moment but it's useful for future improvements
# if the docusaurus labelling works from oldest to newest. The order in the versions.json file should
# go from newest (first in array) to oldest (last in array)
for ((i = ${#internalVersionsArray[@]} - 1;i >= 0;i--)); do
  row=${internalVersionsArray[i]}
  IFS=: read versionsLabel versionsHash includeInDropDown <<< $row

  # This is donw via the website now
  # if [ $includeInDropDown != "true" ]; then
  #   echo Skipping version: $versionsLabel \"$includeInDropDown\"
  #   continue
  # fi

  if [ -z "$versionsLabel" ]; then
    echo Invalid row \(no version label\): $row 
    exit 1
  fi

  if [ -z "$versionsHash" ]; then
    echo Invalid row \(no version hash\): $row
    exit 1
  fi

  echo Process version \'$versionsLabel\' with checkout target of \'$versionsHash\'

  checkoutAndTag
  createVersionedDocs $tempDirForGit/ $DIR $versionsLabel
  createVersiondSidebar $tempDirForGit $DIR $versionsLabel
  versions=,\"$versionsLabel\"$versions

  echo Finished processing \'$versionsLabel\'

done

updateVersionsFile $versions
cleanUpGit $tempDirForGit
