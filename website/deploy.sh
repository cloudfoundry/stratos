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

# License file

cat << EOF > ./docs/license.md
---
id: license
title: License
sidebar_label: License
---

Stratos is licensed under the Apache 2.0 Software License, shown below:

\`\`\`
EOF

cat ${DIR}/../LICENSE >> ./docs/license.md
echo "\`\`\`" >> ./docs/license.md

# Contributing

cat << EOF > ./docs/developer/contributing.md
---
title: Contributing
sidebar_label: Contributing
---

EOF

tail -n +2 ${DIR}/../CONTRIBUTING.md >> ./docs/developer/contributing.md

# Copy and generate files only
if [ "$ARG" == "-g" ]; then
  exit 0
fi

npm run build

# Generate and build only
if [ "$ARG" == "-b" ]; then
  exit 0
fi

msg="Website update: $(date)"

tmpdir=./site-dist
rm -rf site-dist
mkdir -p $tmpdir
pushd $tmpdir
echo "Cloning web site"
git clone git@github.com:cf-stratos/website.git

echo "Copying newer site content ..."
rsync --delete --exclude=.git -r $DIR/build/ ./website

cd website
echo "Adding all files"
git add -A
git commit -m "${msg}"
echo "Pushing changes ..."
git push

popd > /dev/null

rm -rf $tmpdir

popd > /dev/null
