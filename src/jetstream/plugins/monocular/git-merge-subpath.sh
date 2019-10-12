#! /bin/bash

#================================================
# Attribution:
# https://stackoverflow.com/questions/23937436/add-subdirectory-of-remote-repo-with-git-subtree/30386041#30386041
#================================================================

git-merge-subpath() {
    local SQUASH
    if [[ $1 == "--squash" ]]; then
        SQUASH=1
        shift
    fi
    if (( $# != 3 )); then
        local PARAMS="[--squash] SOURCE_COMMIT SOURCE_PREFIX DEST_PREFIX"
        echo "USAGE: ${FUNCNAME[0]} $PARAMS"
        return 1
    fi

    # Friendly parameter names; strip any trailing slashes from prefixes.
    local SOURCE_COMMIT="$1" SOURCE_PREFIX="${2%/}" DEST_PREFIX="${3%/}"

    local SOURCE_SHA1
    SOURCE_SHA1=$(git rev-parse --verify "$SOURCE_COMMIT^{commit}") || return 1

    local OLD_SHA1
    local GIT_ROOT=$(git rev-parse --show-toplevel)
    if [[ -n "$(ls -A "$GIT_ROOT/$DEST_PREFIX" 2> /dev/null)" ]]; then
        # OLD_SHA1 will remain empty if there is no match.
        local RE="^${FUNCNAME[0]}: [0-9a-f]{40} $SOURCE_PREFIX $DEST_PREFIX\$"
        OLD_SHA1=$(git log -1 --format=%b -E --grep="$RE" \
                   | grep --color=never -E "$RE" | tail -1 | awk '{print $2}')
    fi

    local OLD_TREEISH
    if [[ -n $OLD_SHA1 ]]; then
        OLD_TREEISH="$OLD_SHA1:$SOURCE_PREFIX"
    else
        # This is the first time git-merge-subpath is run, so diff against the
        # empty commit instead of the last commit created by git-merge-subpath.
        OLD_TREEISH=$(git hash-object -t tree /dev/null)
    fi &&

    if [[ -z $SQUASH ]]; then
        git merge -s ours --no-commit "$SOURCE_COMMIT"
    fi &&

    git diff --color=never "$OLD_TREEISH" "$SOURCE_COMMIT:$SOURCE_PREFIX" \
        | git apply -3 --directory="$DEST_PREFIX" || git mergetool

    if (( $? == 1 )); then
        echo "Uh-oh! Try cleaning up with |git reset --merge|."
	return 1
    else
        git commit -em "Merge $SOURCE_COMMIT:$SOURCE_PREFIX/ to $DEST_PREFIX/

# Feel free to edit the title and body above, but make sure to keep the
# ${FUNCNAME[0]}: line below intact, so ${FUNCNAME[0]} can find it
# again when grepping git log.
${FUNCNAME[0]}: $SOURCE_SHA1 $SOURCE_PREFIX $DEST_PREFIX"
    fi
}
