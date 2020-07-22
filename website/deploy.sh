#!/usr/bin/env bash

# Build and deploy the website

set -euo pipefail

ARG=${1:-deploy}

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
if [ "$ARG" == "-b" ]; then
  exit 0
fi

msg="Website update: $(date)"

echo "Cloning web site"
rm -rf ./site-dist
git clone git@github.com:cf-stratos/website.git site-dist

echo "Copying newer site content ..."
rsync --delete -r ./build/ ./site-dist

cd site-dist
echo "Adding all files"
git add -A
git commit -m "${msg}"
echo "Pushing changes ..."
git push
cd ..

popd > /dev/null
