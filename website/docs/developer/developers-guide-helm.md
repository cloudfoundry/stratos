---
title: Helm Development Guide
sidebar_label: Helm
---


:::info
This document is currently in progress and will be expanded in the future.
:::


## Building Images

The images references by the helm charts are built in two stages.

### Base Images

Changes to these happen infrequently, so not every dev cycle requires this step.

1. Ensure your docker hub credentials are set
   1. `docker login`
1. Create and push images to docker hub
   1. `cd deploy/stratos-base-images`
   1. `./build-base-images.sh -o dockerhuborgname -p`
       - `p` pushes the images to dockerhub. Replace `dockerhuborgname` with the docker hub org where test images should be pushed
   1. Wait for script to complete, this may take a while

:::note
If you receive the error ``"--squash" is only supported on a Docker daemon with experimental features enabled`` during build enable
experimental feature by
1. Add `"experimental": true` to ~/.docker/config.json
1. Restart docker - `sudo systemctl restart docker`
1. `docker version` should show client with experimental feature enabled
:::

### All Other Images

Changes to these will occur more often and are built upon the base images created above. This step is executed with the command command used
to build the charts below.

## Building Charts

1. Ensure your docker hub credentials are set
   1. `docker login`
1. Create the charts, and create and push images to docker hub
   1. `cd deploy/kubernetes`
   1. `./build.sh -t 4.0.1 -o dockerhuborgname -p`
      -`p` pushes the images to dockerhub. Replace `dockerhuborgname` with the docker hub org where test images should be pushed. This should match where your base images are
      -`t` will tag the images with a version
   1. The new charts with updated image references will be created in `deploy/kubernetes/helm-charts`

### Testing built output

1. `cd deploy/kubernetes`
1. Install the usual way, with your namespace and values (if required). For example
   ```
   helm install console helm-chart --namespace=console --values stratos-values.yaml
   ```

