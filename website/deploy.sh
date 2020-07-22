#!/usr/bin/env bash

# Build and deploy the website

set -euo pipefail

# wesbite folder
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

pushd $DIR > /dev/null
echo "Building website ..."

# Copy helm chart readme
cat << EOF > ./docs/deploy/kubernetes/install.md
---
id: helm-installation
title: Deploying Using Helm
sidebar_label: Deploy using Helm 
---
EOF

# Concatentate the helm chart readme file
tail -n +2 ${DIR}/../deploy/kubernetes/console/README.md >> ./docs/deploy/kubernetes/install.md
npm run build


# Build only
if [ "$1" == "-b" ]; then
  exit 0
fi

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
