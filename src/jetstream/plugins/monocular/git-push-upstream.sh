#!/bin/bash

echo "== Push Monocular Changes Upstream ==" >&1

usage() {
	echo "Usage: git-push-upstream.sh -f <MONOCULAR_FORK> -t <MONOCULAR_BRANCH> -s <STRATOS_SOURCE_BRANCH> ]" >&1
	echo "  options:" >&1
	echo "    -f MONOCULAR_FORK         The upstream fork/repo to push to" >&1
	echo "    -t MONOCULAR_BRANCH       The target upstream branch to push to" >&1
	echo "    -s STRATOS_SOURCE_BRANCH  The Stratos branch containing the changes" >&1
	echo "    -h usage"
}

while getopts f:t:s:h arg; do
	case ${arg} in
		f)   MONOCULAR_FORK=${OPTARG};;
		t)   MONOCULAR_BRANCH=${OPTARG};;
		s)   STRATOS_BRANCH=${OPTARG};;
		h)   usage;;
		\?)  usage;;
	esac
done


if [[ -z "$MONOCULAR_FORK"  ||  -z "$MONOCULAR_BRANCH" || -z "$STRATOS_BRANCH" ]]; then
	usage
	exit 1
fi

echo "Monocular fork: $MONOCULAR_FORK" >&1
echo "Monocular branch: $MONOCULAR_BRANCH" >&1
echo "Stratos source branch: $STRATOS_BRANCH" >&1

DIRPATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "${DIRPATH}"

pushd "${DIRPATH}" >& /dev/null || exit

source ./git-merge-subpath.sh

echo "Checking out monocular target branch: $MONOCULAR_BRANCH from $MONOCULAR_FORK into temporary merge branch: temp-merge-branch" >&1

##Change to top level of repo
repo_root=$(git rev-parse --show-toplevel)
echo "Moving to repo top level: $repo_root" >&1
pushd "$repo_root" >&/dev/null || exit

##Checkout the monocular feature branch onto a temporary merge branch
git fetch "$MONOCULAR_FORK"
git checkout -b temp-merge-branch "$MONOCULAR_FORK"/"$MONOCULAR_BRANCH" || exit

##Merge changes from our monocular subtree in Stratos v2-master to our temp-merge-branch

echo "Merging Stratos branch $STRATOS_BRANCH at src/jetstream/plugins/monocular into temp-merge-branch" >&1

git-merge-subpath --squash origin/"$STRATOS_BRANCH" src/jetstream/plugins/monocular cmd
if [ $? -ne 0 ]; then
	echo "Unsuccessful." >&2
	#Move back to repo root - important in case of bail-out here.
	popd >& /dev/null || exit
	exit 1
else

	echo "Pushing changes to target branch: $MONOCULAR_BRANCH on $MONOCULAR_FORK" >&1

        ##Push the temporary merge branch back to the monocular feature branch
        git push "$MONOCULAR_FORK" HEAD:"$MONOCULAR_BRANCH"
        if [ $? -ne 0 ]; then
	     echo "Failed to push to branch: $MONOCULAR_BRANCH on $MONOCULAR_FORK." >&2
        else
	     echo "Cleaning up temporary branches" >&1
             ##Cleanup: remove our temporary merge branch
             git checkout "$STRATOS_BRANCH" && git branch -d temp-merge-branch
       fi
fi

popd >& /dev/null || exit
popd >& /dev/null || exit

if [ $? -eq 0 ]; then
	echo "Success" >&1
fi
