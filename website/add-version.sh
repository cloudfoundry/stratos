#!/usr/bin/env bash
set -e
set -o pipefail

echo "Determining version Label & Tag"

# GITHUB_EVENT_PATH points to json containing event data. This contains the github release object
# See https://developer.github.com/webhooks/event-payloads/#release
versionLabel=$(jq -r '.release.name' $GITHUB_EVENT_PATH)
versionSha=$(jq -r '.release.tag_name' $GITHUB_EVENT_PATH)
showVersionInDropDown=true
internalVersionsFile="internal-versions.json"

if [[ $versionLabel == "stable" ]]; then
  echo "Skipping release, 'stable' is ignored"
  exit 1
fi

echo Adding the following as latest docs version
echo "Label            : $versionLabel"
echo "Tag/Sha          : $versionSha"
echo "Show In Dropdown : $showVersionInDropDown"

interalVersion=$versionLabel:$versionSha:$showVersionInDropDown
echo "New Version      : $interalVersion"

# Write to temp env var. Not sure why, but a simple `> $internalVersionsFile` wipes out content
res=$(jq --arg argval $interalVersion -r '. |= [$argval] + .' $internalVersionsFile)
echo "$res" > $internalVersionsFile

echo "Result           :"
cat $internalVersionsFile
