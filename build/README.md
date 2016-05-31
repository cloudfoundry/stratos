Useful commands

1. List Registry contents
```
$  curl -X GET https://docker-registry.helion.space/v2/_catalog
```

2. Tear down the Console specific components vs restarting the entire dev harness
```
# Get the port
$ curl -Ss http://192.168.200.2:8080/api/v1/namespaces/ucp/services/ipmgr | jq '.spec.ports[0].nodePort'

# Tear down the Console using the port
$ curl -X DELETE http://192.168.200.3:<port>/v1/instances/cnapconsole
```

3. To see more details information than what the Kubernetes Dashboard provides

```
# SSH to the node VM
$ vagrant ssh node

# Get a list of failed containers
node$ sudo docker ps -a

# Get the log of a specific container
node$ docker logs 4499d41872a2

# Inspect a container to view ENV vars, etc.
node$ sudo docker inspect d48da0be6e66
```
