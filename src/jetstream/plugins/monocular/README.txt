docker run -p 8080:8080 --rm -e -ti --network=host kreinecke/suse-fdb-chart-repo:latest /chartrepo serve --doclayer-url=mongodb://192.168.57.1:27016 stable https://kubernetes-charts.storage.googleapis.com

To test sync and status fetch:
curl -X PUT -H "Content-Type: application/json" -d '{"repoURL":"https://kubernetes-charts.storage.googleapis.com"}' http://localhost:8080/v1/sync/stable

curl -X GET http://localhost:8080/v1/status/stabler
