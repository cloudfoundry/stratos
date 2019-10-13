# Syncing this subtree with the Monocular repo

## Common Prerequisites 

**NOTE:**

The scripts do their best to fail gracefully. To avoid problems however, make sure the following pre-requisities are done before attempting. A CTRL-C in the middle of a run will likely require some cleanup.


1. Ensure you have the monocular fork as a remote. e.g.

`git remote add -f -t master stratos-monocular-fork git@github.com:cf-stratos/monocular.git`

2. With a second remote it's useful to store remote refs separately in case of branch/tag collisions:

`git config --add remote.stratos-monocular-fork.fetch 'refs/tags/*:refs/rtags/stratos-monocular-fork/*'`

## Before running the PULL script
Follow these carefully. 

1. Ensure you are on the branch you want to merge into.
2. Ensure you have no unstaged or uncommitted changes
3. `git status` should be clean

## Before running the PUSH script
1. Ensure that at least one pull haa been made already
2. Ensure the monocular target branch exists and has been pushed to its monocular remote
3. Ensure you have no unstaged or uncommitted changes.
4. `git status` should be clean.

## Running the scripts..

Both scripts, when run either without arguments or with the -h flag, will show usage instructions.

### pull script:

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

#### To pull a tag:
The tag should be specufied as : `refs/rtags/stratos-monocular-fork/<tag>`
e.g.


### push script:
        echo "Usage: git-push-upstream.sh -f <MONOCULAR_FORK> -t <MONOCULAR_BRANCH> -s <STRATOS_SOURCE_BRANCH> ]" >&1
        echo "  options:" >&1
        echo "    -f MONOCULAR_FORK         The upstream fork/repo to push to" >&1
        echo "    -t MONOCULAR_BRANCH       The target upstream branch to push to" >&1
        echo "    -s STRATOS_SOURCE_BRANCH  The Stratos branch containing the changes" >&1
        echo "    -h usage"
