### Run chart repo in serve mode WITH TLS ###
### Modify the bind mounts according to location of certs on your system

docker run -p 8080:8080 --rm -e -ti --network=host -v ~/dev/git/fdb-doclayer-fork/packaging/docker/testcerts:/etc/tlscerts kreinecke/suse-fdb-chart-repo:latest /chartrepo serve --doclayer-url=mongodb://localhost:27016 stable https://kubernetes-charts.storage.googleapis.com --cafile /etc/tlscerts/ca.crt --certfile /etc/tlscerts/client.crt --keyfile /etc/tlscerts/client.key --debug

To test sync and status fetch:
curl -X PUT -H "Content-Type: application/json" -d '{"repoURL":"https://kubernetes-charts.storage.googleapis.com"}' http://localhost:8080/v1/sync/stable

curl -X GET http://localhost:8080/v1/status/stable


### TLS Currently not optional, but for reference, use command below if making optional in future ###
docker run -p 8080:8080 --rm -e -ti --network=host kreinecke/suse-fdb-chart-repo:latest /chartrepo serve --doclayer-url=mongodb://192.168.57.1:27016 stable https://kubernetes-charts.storage.googleapis.com
