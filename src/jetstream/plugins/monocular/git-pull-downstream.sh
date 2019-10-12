#!/bin/bash

echo "=== Pull Monocular Code to Stratos Repo ===" >&1
echo "Pulls the subtree under cmd from monocular repo into the src/jetstream/plugins/monocular subtree in stratos" >&1
usage() {
	echo    "Usage: git-pull-downstream.sh -f <MONOCULAR_FORK> [ -b <MONOCULAR_BRANCH>  | -r <MONOCULAR_REF> ]" >&1
	echo    "  options:" >&1
	printf  "    -f MONOCULAR_FORK         The upstream fork/repo to pull from\n" >&1
	printf  "    ONE OF EITHER -m or -s must be set\n" >&1
	echo    "    -b MONOCULAR_BRANCH       The upstream branch to pull from" >&1
	echo    "    -r MONOCULAR_REF  The upsream ref to pull from (e.g. tag or SHA1)" >&1
	echo    "    -h usage" >&1
	exit 0
}

while getopts f:b:r:h arg 
do
	case ${arg} in
		f)   MONOCULAR_FORK=${OPTARG};;
		b)   MONOCULAR_BRANCH=${OPTARG};;
		r)   MONOCULAR_REF=${OPTARG};;
		h)   usage;;
		\?)  usage;;
	esac
done

if [ -z "$MONOCULAR_FORK" ]; then
	echo "Must specify a monocular fork to pull from" >&2
	usage
fi

if [ -n "$MONOCULAR_BRANCH" ] && [ -n "$MONOCULAR_REF" ] || [ -z "$MONOCULAR_BRANCH" ] && [ -z "$MONOCULAR_REF" ]; then
	echo "Must specify either a monocular branch or ref to pull from" >&2
	usage
fi

echo "Monocular fork: $MONOCULAR_FORK" >&1
echo "Monocular branch: $MONOCULAR_BRANCH" >&1
echo "Monocular ref: $MONOCULAR_REF" >&1

DIRPATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "${DIRPATH}"

pushd "${DIRPATH}" >& /dev/null || exit

source ./git-merge-subpath.sh

echo "Fetching $MONOCULAR_FORK"

# Fetch and merge the monocular subtree into the Stratos repo and attempt squash commit
git fetch "$MONOCULAR_FORK"

# Set our pull ref to either "fork/branch" or [tag|commit]
if [ -n "$MONOCULAR_REF" ]; then
	PULL_REF="$MONOCULAR_REF"
else
	PULL_REF="$MONOCULAR_FORK/$MONOCULAR_BRANCH"
fi

echo "Reading subtree index from $MONOCULAR_FORK:cmd. Merging in changes from $PULL_REF into src/jetstream/plugins/monocular" >&1
# Move to root of repo
repo_root=$(git rev-parse --show-toplevel)
echo "Moving to repo top level: $repo_root" >&1
pushd "$repo_root" >&/dev/null || exit

# Read in tree
# Git diff apply from last commit (or none) to the specified commit between the given subtrees
git-merge-subpath --squash "$PULL_REF" cmd src/jetstream/plugins/monocular
merge_retval=$?

popd >& /dev/null || exit
popd >& /dev/null || exit

if [ $merge_retval -eq 0 ]; then
	echo "Success" >&1
fi

