#!/bin/bash

set -e

PR=$1
if [ -z "${PR}" ]; then
  echo "You must specify a PR number"
fi

echo "Creating a branch in the repo for PR #${PR}"

FILE=./.pr-details.json
curl "https://api.github.com/repos/SUSE/stratos-ui/pulls/${PR}" > $FILE

FORK=`jq -r '.head.repo.fork' .pr-details.json`
if [ "${FORK}" != "true" ]; then
  echo "This is not a fork of the Stratos repository"
  exit 1
fi

CLONE_URL=`jq -r '.head.repo.clone_url' .pr-details.json`
if [ -z "${CLONE_URL}" ]; then
  echo "Could not get clone URL"
  exit 1
fi

ORIGIN_NAME=`jq -r '.head.repo.owner.login' .pr-details.json`
if [ -z "${ORIGIN_NAME}" ]; then
  echo "Could not get repo owner"
  exit 1
fi

REF=`jq -r '.head.ref' .pr-details.json`
if [ -z "${REF}" ]; then
  echo "Could not get ref"
  exit 1
fi

rm $FILE

mkdir -p temp
cd temp

BRANCH="pr-${PR}"
rm -rf ${BRANCH}

echo "Details"
echo "  Clone URL  : ${CLONE_URL}"
echo "  Origin Name: ${ORIGIN_NAME}"
echo "  Ref        : ${REF}"
echo "  Branch     : ${BRANCH}"
echo ""

echo "Cloning SUSE/stratos-ui"
git clone git@github.com:SUSE/stratos-ui.git ${BRANCH}

echo "Creating branch: ${BRANCH}"
cd ${BRANCH}
git checkout -b ${BRANCH}

echo "Merging PR changes from fork to branch"
git remote add ${ORIGIN_NAME} ${CLONE_URL}
git fetch ${ORIGIN_NAME}
git merge --no-ff ${ORIGIN_NAME}/${REF} -m "Merge ${ORIGIN_NAME}/${REF}"

echo "Pushing changes to SUSE/stratos-ui"
git push origin ${BRANCH}

echo "Finished"