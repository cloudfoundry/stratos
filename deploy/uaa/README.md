# Local UAA from Build 

1. Run the prep script 

```
./prepare.sh
```

2. Build the docker image
 
```
sudo docker build -f Dockerfile.dev -t local-uaa .
```

3. Create the container 
```
sudo docker run -p 8080:8080 local-uaa
``` 

The UAA instance will then be available at http://localhost:8080