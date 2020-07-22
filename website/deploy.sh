#!/usr/bin/env bash

# Build and deploy the website

set -euo pipefail

# wesbite folder
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

pushd $DIR > /dev/null
echo "Building website ..."
#npm run build

msg="Website update: $(date)"

if [ ! -d "./site-dist" ]; then
  echo "Cloning website project"
  git clone git@github.com:cf-stratos/website.git site-dist
else
  echo "Updating site checkout"
  cd site-dist
  git fetch
  git reset --hard origin/master
  git clean -fd
  git rebase
  cd ..
fi

echo "Copying newer site content ..."
rsync -r ./build/ ./site-dist

cd site-dist
echo "Adding all files"
git add -A
git commit -m "${msg}"
echo "Pushing changes ..."
git push
cd ..

popd > /dev/null
