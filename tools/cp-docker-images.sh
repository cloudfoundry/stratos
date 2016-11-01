#!/bin/bash
set -eu

echo "hsc-console"
echo "-- pulling"
docker pull docker-registry.helion.space:443/hsc/hsc-console:1.0.17-0-g31bde43
echo "-- tagging"
docker tag docker-registry.helion.space:443/hsc/hsc-console:1.0.17-0-g31bde43 stackatodev/hsc-console:1.0.17-0-g31bde43
echo "-- pushing"
docker push stackatodev/hsc-console:1.0.17-0-g31bde43

echo "hsc-proxy"
echo "-- pulling"
docker pull docker-registry.helion.space:443/hsc/hsc-proxy:1.0.17-0-g31bde43
echo "-- tagging"
docker tag docker-registry.helion.space:443/hsc/hsc-proxy:1.0.17-0-g31bde43 stackatodev/hsc-proxy:1.0.17-0-g31bde43
echo "-- pushing"
docker push stackatodev/hsc-proxy:1.0.17-0-g31bde43

echo "hsc-stolon"
echo "-- pulling"
docker pull docker-registry.helion.space:443/hsc/hsc-stolon:1.0.17-0-g31bde43
echo "-- tagging"
docker tag docker-registry.helion.space:443/hsc/hsc-stolon:1.0.17-0-g31bde43 stackatodev/hsc-stolon:1.0.17-0-g31bde43
echo "-- pushing"
docker push stackatodev/hsc-stolon:1.0.17-0-g31bde43

echo "hsc-etcd"
echo "-- pulling"
docker pull docker-registry.helion.space:443/hsc/hsc-etcd2:1.0.17-0-g31bde43
echo "-- tagging"
docker tag docker-registry.helion.space:443/hsc/hsc-etcd2:1.0.17-0-g31bde43 stackatodev/hsc-etcd2:1.0.17-0-g31bde43
echo "-- pushing"
docker push stackatodev/hsc-etcd2:1.0.17-0-g31bde43

echo "hsc-postflight-job"
echo "-- pulling"
docker pull docker-registry.helion.space:443/hsc/hsc-postflight-job:1.0.17-0-g31bde43
echo "-- tagging"
docker tag docker-registry.helion.space:443/hsc/hsc-postflight-job:1.0.17-0-g31bde43 stackatodev/hsc-postflight-job:1.0.17-0-g31bde43
echo "-- pushing"
docker push stackatodev/hsc-postflight-job:1.0.17-0-g31bde43

echo "hsc-preflight-job"
echo "-- pulling"
docker pull docker-registry.helion.space:443/hsc/hsc-preflight-job:1.0.17-0-g31bde43
echo "-- tagging"
docker tag docker-registry.helion.space:443/hsc/hsc-preflight-job:1.0.17-0-g31bde43 stackatodev/hsc-preflight-job:1.0.17-0-g31bde43
echo "-- pushing"
docker push stackatodev/hsc-preflight-job:1.0.17-0-g31bde43

# docker-registry.helion.space:443/hsc/hsc-console                1.0.17-0-g31bde43   c5c35b2db6e9        23 hours ago        208.8 MB
# docker-registry.helion.space:443/hsc/hsc-stolon                 1.0.17-0-g31bde43   d160ea6bfe6c        23 hours ago        613.2 MB
# docker-registry.helion.space:443/hsc/hsc-etcd2                  1.0.17-0-g31bde43   25e840d41054        23 hours ago        238.2 MB
# docker-registry.helion.space:443/hsc/hsc-proxy                  1.0.17-0-g31bde43   55759e4b7546        23 hours ago        353.7 MB
# docker-registry.helion.space:443/hsc/hsc-postflight-job         1.0.17-0-g31bde43   804fa7c48521        7 days ago          841.4 MB
# docker-registry.helion.space:443/hsc/hsc-preflight-job          1.0.17-0-g31bde43   2f5b5ae732d7        8 weeks ago         215.7 MB

echo "Done."
