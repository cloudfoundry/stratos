# Development on Helion Stackato v4.0 Console UI
In this section, we describe how to set up your local development environment so that you are able to run through the application end-to-end. In this setup, Docker containers hosting the application will point to Helion Code Engine installed on HCP.

Please ensure you have the following installed:
- Docker
- Vagrant
- VMWare Fusion or Workstation
  - send an email to **hp@vmware.com** with subject "Fusion License Request" or "Workstation License Request"
- vagrant-reload plugin
- vagrant-vmware-fusion plugin (or vagrant-vmware-workstation) - **you will need to purchase a license**
- VirtualBox (optional)

### <a id="install-hcp"></a>1. Install HCP
- Create a Dockerhub account
- Request access to the 'helioncf' organization in Dockerhub
- Request access to Helion Code Engine repositories in Dockerhub (contact: Wayne Foley)
- Download the [HCP 1.2.3 dev harness](https://s3-us-west-2.amazonaws.com/hcp-concourse/hcp-developer-1.2.3%2Bmaster.dd447a0.20160615085128.tar.gz)
- Install Vagrant plugins:
  - `vagrant plugin install vagrant-reload`
  - `vagrant plugin install vagrant-vmware-fusion` or `vagrant plugin install vagrant-vmware-workstation`
- To install, run the following command in the *hcp-developer* folder (using your Dockerhub credentials):
  - **Mac**: `DOCKER_USERNAME=<username> DOCKER_EMAIL=<email> DOCKER_PASSWORD=<pw> ./start.sh`
  - **Windows/Linux**: `DOCKER_USERNAME=<username> DOCKER_EMAIL=<email> DOCKER_PASSWORD=<pw> ./start.sh`
- When install is complete, note the IPMGR port you can reach HCP on. You will need it to install Helion Code Engine
- SSH into the *master*: `vagrant ssh master`
- Wait until all pods are in the "Running" state: `watch kubectl get pods --all-namespaces`

### <a id="install-hsm"></a>2. Install Helion Service Manager on HCP
- Download the [installer](https://s3-us-west-2.amazonaws.com/helion-service-manager/release/master/hsm-installer/0.1.27/setup.tgz)
- Edit the `hcp_version` file and set it to `1.2.3`
- Set environmental variables:
  - `export HCP_NODE_IP=192.168.200.3`
  - `export HCP_MASTER_IP=192.168.200.2`
- Run the installation script: `./install.bash`
- When installation has completed, make note of the API location. This is used by the HSM CLI to install other services such as Helion Code Engine.

### <a id="install-hce"></a>2. Install Helion Code Engine on HCP
- Download the HSM CLI for your operating system. You will use this to install Helion Code Engine.
  - [OSX](https://s3-us-west-2.amazonaws.com/helion-service-manager/release/master/hsm-cli/dist/0.1.27/hsm-0.1.27-darwin-amd64.tar.gz)
  - [Windows](https://s3-us-west-2.amazonaws.com/helion-service-manager/release/master/hsm-cli/dist/0.1.27/hsm-0.1.27-windows-amd64.zip)
  - [Linux](https://s3-us-west-2.amazonaws.com/helion-service-manager/release/master/hsm-cli/dist/0.1.27/hsm-0.1.27-linux-amd64.tar.gz)
- Set the API: `./hsm api <HSM API from Step 2>`
- Create a Helion Code Engine instance: `./hsm create-instance hpe-catalog:helionce`
  - You will need to specify:
    - instance name (ex. hce)
    - Docker credentials
    - SSL cert and key
    - Mirror cert and key
- Wait for all Helion Code Engine pods to be in the "Running" state
- Get the port of the "hce-rest" service:
  - `curl http://192.168.200.2:8080/api/v1/namespaces/<INSTANCE_NAME>/services/hce-rest`
  - You will need this port to register an HCE endpoint in the Console UI

### <a id="register-ui"></a>3. Register the Helion Stackato v4.0 Console UI on Github
- Head over to: https://github.com/settings/developers
- Register the Console UI as a new application
  - Homepage URL: `http://<DOCKER MACHINE IP>` (ex. `192.168.99.100`)
  - Authorization callback URL: `http://<DOCKER MACHINE IP>/pp/v1/github/oauth/callback`
- Set the following environmental variables using the generated client ID and secret:
```
export GITHUB_OAUTH_CLIENT_ID=<CLIENT ID>
export GITHUB_OAUTH_CLIENT_SECRET=<CLIENT SECRET>
```

### <a id="running-ui"></a>4. Running the Helion Stackato v4.0 Console UI
- Clone all related repositories
  - If starting from a fresh install, run: `sh start_fresh.sh`. This will clone all necessary repositories.
  - Otherwise, manually clone the following repositories:
    - helion-ui-theme
    - helion-ui-framework
    - stratos-ui
    - portal-proxy (important! clone into **$GOPATH/src/github.com/hpcloud**)
- [Create a Docker machine](create_docker_machine.md)
  - To keep using VirtualBox, you can run these commands:
    - `docker-machine create --driver virtualbox`
    - `eval $(docker-machine env default)`
- Determine and set the UAA endpoint:
  - `curl -Ss http://192.168.200.2:8080/api/v1/namespaces/hcp/services/ident-api | jq '.spec.ports[0].nodePort'`
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
