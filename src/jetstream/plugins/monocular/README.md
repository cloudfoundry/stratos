# Syncing this subtree with the Monocular repo

## Common Prerequisites 

**NOTE:**

The scripts do their best to fail gracefully. To avoid problems however, make sure the following pre-requisities are done before attempting. A CTRL-C in the middle of a run will likely require some cleanup.


1. Ensure you have the monocular fork as a remote. e.g.

```
git remote add -f -t master stratos-monocular-fork git@github.com:cf-stratos/monocular.git
```

2. With a second remote it's useful to store remote refs separately in case of branch/tag collisions:

```
git config --add remote.stratos-monocular-fork.fetch 'refs/tags/*:refs/rtags/stratos-monocular-fork/*
```

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

Both scripts, when run either without arguments or with the `-h` flag, will show usage instructions.

### PULL script:

This pulls the subtree from monocular repo under `/cmd` into the stratos repo under `/src/jetstream/plugins/monocular`

Usage:

```
git-pull-downstream.sh -f <MONOCULAR_FORK> [ -b <MONOCULAR_BRANCH>  | -r <MONOCULAR_REF> ]
-f MONOCULAR_FORK         The upstream (monocular) repo"
-b MONOCULAR_BRANCH       The upstream branch to pull from" >&1
-r MONOCULAR_REF          The upsream ref to pull from (e.g. tag or SHA1)
```

e.g.

```
./git-pull-downstream.sh -f stratos-monocular-fork -b master
```

#### To pull a tag:
The tag should be specufied as : `refs/rtags/stratos-monocular-fork/<tag>`

e.g.

```
./git-pull-downstream.sh -f stratos-monocular-fork -r refs/rtags/stratos-monocular-fork/v1.4.0
```


### PUSH script:
Usage: 

```
git-push-upstream.sh -f <MONOCULAR_FORK> -t <MONOCULAR_BRANCH> -s <STRATOS_SOURCE_BRANCH> ]
-f MONOCULAR_FORK         The upstream (monocular) repo to push to"
-t MONOCULAR_BRANCH       The target (monocular) upstream branch to push to
-s STRATOS_SOURCE_BRANCH  The source stratos branch containing the changes
```

e.g. 

```
./git-push-upstream.sh -f stratos-monocular-fork -t feature-branch -s dummy-master
```