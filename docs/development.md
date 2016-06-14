# Development on Helion Stackato v4.0 Console UI
In this section, we describe how to set up your local development environment so that you are able to run through the application end-to-end. In this setup, Docker containers hosting the application will point to Helion Code Engine installed on UCP.

Please ensure you have the following installed:
- Docker
- Vagrant
- VMWare Fusion or Workstation
  - send an email to **hp@vmware.com** with subject "Fusion License Request" or "Workstation License Request"
- vagrant-reload plugin
- vagrant-vmware-fusion plugin (or vagrant-vmware-workstation) - **you will need to purchase a license**
- VirtualBox (optional)

### <a id="install-ucp"></a>1. Install UCP
- Create a Dockerhub account
- Request access to the 'helioncf' organization in Dockerhub
- Request access to Helion Code Engine repositories in Dockerhub (contact: Wayne Foley)
- Download the [UCP 1.1.22 dev harness](https://s3-us-west-2.amazonaws.com/ucp-concourse/ucp-developer-1.1.22%2Bmaster.50a8819.20160519192614.tar.gz)
- Install Vagrant plugins:
  - `vagrant plugin install vagrant-reload`
  - `vagrant plugin install vagrant-vmware-fusion` or `vagrant plugin install vagrant-vmware-workstation`
- To install, run the following command in the *ucp-developer* folder (using your Dockerhub credentials):
  - **Mac**: `DOCKER_USERNAME=<username> DOCKER_EMAIL=<email> DOCKER_PASSWORD=<pw> vagrant up --provider=vmware_fusion`
  - **Windows/Linux**: `DOCKER_USERNAME=<username> DOCKER_EMAIL=<email> DOCKER_PASSWORD=<pw> vagrant up --provider=vmware_workstation`
- When install is complete, ssh into the *master*: `vagrant ssh master`
- Wait until all pods are in the "Running" state: `watch kubectl get pods --all-namespaces`

### <a id="install-hce"></a>2. Install Helion Code Engine on UCP
- Open another terminal
- Download the [service definition template](https://github.com/hpcloud/code-engine/blob/master/ucp/definition/hce-service-definition.json.template)
- Download the [instance definition template](https://github.com/hpcloud/code-engine/blob/master/ucp/instance/hce-service.json.template)
- Set the image tags in the service definition to "kosher-prod"
- Set the Dockerhub credentials in the instance definition
- Obtain the registry mirror cert and cert key from a member of the Helion Code Engine team or Kelly
- Register Helion Code Engine with UCP:
  - Get the ipmgr port:
    - `curl -Ss http://192.168.200.2:8080/api/v1/namespaces/ucp/services/ipmgr | jq '.spec.ports[0].nodePort'`
  - Register (replacing port and definition file paths from previous steps):
    - `curl -H "Content-Type: application/json" -X POST -d @hce-service-definition.json http://192.168.200.3:<IPMGR PORT>/v1/services`
    - `curl -H "Content-Type: application/json" -X POST -d @hce-service.json http://192.168.200.3:<IPMGR PORT>/v1/instances`
- Wait for all Helion Code Engine pods to be in the "Running" state
- Get the port of the "hce-rest" service:
  - `curl http://192.168.200.2:8080/api/v1/namespaces/helion-code-engine/services/hce-rest`
  - You will need this port to register an HCE endpoint in the Console UI

### <a id="register-ui"></a>3. Register the Helion Stackato v4.0 Console UI on Github
- Head over to: https://github.com/settings/developers
- Register the Console UI as a new application
  - Homepage URL: `http://<DOCKER MACHINE IP>` (ex. `192.168.99.100`)
  - Authorization callback URL: `http://<DOCKER MACHINE IP>/pp/v1/github/oauth/callback`
- Set the following environmental variables using the generated client ID, secret and state:
```
export GITHUB_OAUTH_CLIENT_ID=<CLIENT ID>
export GITHUB_OAUTH_CLIENT_SECRET=<CLIENT SECRET>
export GITHUB_OAUTH_STATE=<STATE>
```

### <a id="running-ui"></a>4. Running the Helion Stackato v4.0 Console UI
- Clone all related repositories
  - If starting from a fresh install, run: `sh start_fresh.sh`. This will clone all necessary repositories.
  - Otherwise, manually clone the following repositories:
    - helion-ui-theme
    - helion-ui-framework
    - stratos-server
    - stratos-ui
    - portal-proxy (important! clone into **$GOPATH/src/github.com/hpcloud**)
- [Create a Docker machine](create_docker_machine.md)
  - To keep using VirtualBox, you can run these commands:
    - `docker-machine create --driver virtualbox`
    - `eval $(docker-machine env default)`
- Determine and set the UAA endpoint:
  - `curl -Ss http://192.168.200.2:8080/api/v1/namespaces/ucp/services/ident-api | jq '.spec.ports[0].nodePort'`
  - In `proxy.env`, set the following variables:
    - `CONSOLE_CLIENT=console`
    - `UAA_ENDPOINT=https://192.168.200.3:<IDENT-API-PORT>/oauth/token`
- Generate portal-proxy binary (or use the `stand-up-dev-env.sh` script)
  - `cd $GOPATH/src/github.com/hpcloud/portal-proxy`
  - `./tools/build_portal_proxy.sh`
- Back in stratos-deploy, build and run (or use the `stand-up-dev-env.sh` script):
```
docker-compose -f docker-compose.development.yml build
docker-compose -f docker-compose.development.yml up -d
docker logs -f stratosdeploy_ui_1
```
- Get the Docker machine IP: `docker-machine ip default`
- The Console UI should be available at the IP address returned above
- Please ask any Console UI team member for login credentials

#### Helpful Scripts
There are two scripts available for your convenience:
- [stand-up-dev-env.sh](../stand-up-dev-env.sh)
- [cleanup-docker-compose.sh](../cleanup-docker-compose.sh)
