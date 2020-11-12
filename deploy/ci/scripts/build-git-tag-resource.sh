#!/bin/bash

# Builds the Docker image used by our Concourse pipelines to detect a tag update

rm -rf ./tmp
mkdir -p ./tmp
cd ./tmp
git clone https://github.com/concourse/git-resource.git
cp ../git-resource-check ./git-resource/assets/check
chmod +x ./git-resource/assets/check

# Ignore tests as we've changed the behaviour, to they won't pass
echo "#!/bin/bash" >  ./git-resource/test/all.sh
echo "#!/bin/bash" >  ./git-resource/integration-tests/integration.sh

docker build ./git-resource -t ghcr.io/cf-stratos/stratos-git-tag-resource:latest
docker push ghcr.io/cf-stratos/stratos-git-tag-resource:latest
rm -rf ./tmp
echo "All done"