# Development on Helion Stackato v4.0 Console UI
In this section, we describe how to set up your local development environment so that you are able to run through the application end-to-end. In this setup, Docker containers hosting the application will point to Helion Code Engine installed on HCP.

Please ensure you have the following installed:
* Docker
* Vagrant
* VMWare Fusion or Workstation
  - send an email to **hp@vmware.com** with subject "Fusion License Request" or "Workstation License Request"
* vagrant-reload plugin
* vagrant-vmware-fusion plugin (or vagrant-vmware-workstation) - **you will need to purchase a license**
* VirtualBox (optional)

### <a id="install-hcp"></a>1. Install HCP
* Create a Dockerhub account
* Request access to the 'helioncf' organization in Dockerhub
* Request access to Helion Code Engine repositories in Dockerhub (contact: Wayne Foley)
* Download the [HCP 1.2.18 dev harness](https://s3-us-west-2.amazonaws.com/hcp-concourse/hcp-developer-1.2.18%2Bmaster.c8e429d.20160717012701.tar.gz)
* Install Vagrant plugins:
  - `vagrant plugin install vagrant-reload`
  - `vagrant plugin install vagrant-vmware-fusion` or `vagrant plugin install vagrant-vmware-workstation`
* To install, run the following command in the *hcp-developer* folder (using your Dockerhub credentials):
  - `DOCKER_USERNAME=<username> DOCKER_EMAIL=<email> DOCKER_PASSWORD=<pw> ./start.sh`
* When install is complete, note the HCP service and service manager location. You will need it to install Helion Code Engine.
* SSH into the *master*: `vagrant ssh master`
* Wait until all pods are in the "Running" state: `watch kubectl get pods --all-namespaces`
* SSH into the "node" instance and perform an explicit Docker login:
  ```
  vagrant ssh node
  sudo su
  docker login
  ```

### <a id="login-hcp"></a>2. HCP Login
* Download and install the HCP CLI for your operating system. You will use this to log into HCP and retrieve the token necessary for installing other services.
  - [Linux](https://s3-us-west-2.amazonaws.com/hcp-cli-release/hcp-1.2.18-linux-amd64.tar.gz)
  - [OSX](https://s3-us-west-2.amazonaws.com/hcp-cli-release/hcp-1.2.18-darwin-amd64.tar.gz)
  - [Windows](https://s3-us-west-2.amazonaws.com/hcp-cli-release/hcp-1.2.18-windows-amd64.zip)
* Log into HCP and export the access token:
```
hcp api <HCP service HTTP location from Step 1>
hcp login admin@cnap.local -p <admin@cnap.local password>
export token=$(cat $HOME/.hcp | jq -r .AccessToken)
```
* Add the `publisher` role to the admin user: `hcp update-user admin@cnap.local -r publisher`

### <a id="install-hce"></a>3. Install Helion Code Engine on HCP
* Download and install the HSM CLI for your operating system. You will use this to install Helion Code Engine.
  - [Linux](https://helion-service-manager.s3.amazonaws.com/release/master/hsm-cli/dist/0.1.73/hsm-0.1.73-linux-amd64.tar.gz)
  - [OSX](https://helion-service-manager.s3.amazonaws.com/release/master/hsm-cli/dist/0.1.73/hsm-0.1.73-darwin-amd64.tar.gz)
  - [Windows](https://helion-service-manager.s3.amazonaws.com/release/master/hsm-cli/dist/0.1.73/hsm-0.1.73-windows-amd64.zip)
* Set the API: `hsm api <Service manager location from Step 1>`
* Log into HSM: `hsm login --skip-ssl-validation`
* Download the `instance.json` file specific to [Helion Code Engine](https://helion-service-manager.s3.amazonaws.com/release/master/instance-definition/hce/instance.json).
* Set the Docker credentials, SSL cert and key, and mirror cert and key in the `instance.json` file.
* Create a Helion Code Engine instance: `hsm create-instance hpe-catalog.hpe.hce -i instance.json`
* Wait for all Helion Code Engine pods to be in the "Running" state.
* Get the port of the "hce-rest" service:
  - `curl http://192.168.200.2:8080/api/v1/namespaces/helion-code-engine/services/hce-rest`
  - You will need this port to register an HCE endpoint in the Console UI

### <a id="register-ui"></a>4. Register the Helion Stackato v4.0 Console UI on Github
* Head over to: https://github.com/settings/developers
* Register the Console UI as a new application
  - Homepage URL: `http://<DOCKER MACHINE IP>` (ex. `192.168.99.100`)
  - Authorization callback URL: `http://<DOCKER MACHINE IP>/pp/v1/github/oauth/callback`
* Create a `development.rc` file based on the provided [template](../development.rc.template)
* Set the following environmental variables using the generated client ID and secret:
```
export GITHUB_OAUTH_CLIENT_ID=<CLIENT ID>
export GITHUB_OAUTH_CLIENT_SECRET=<CLIENT SECRET>
```

### <a id="running-ui"></a>5. Running the Helion Stackato v4.0 Console UI
* Clone all related repositories
  - If starting from a fresh install, run: `sh start_fresh.sh`. This will clone all necessary repositories.
  - Otherwise, manually clone the following repositories:
    - stratos-ui
    - helion-ui-framework
    - portal-proxy (important! clone into **$GOPATH/src/github.com/hpcloud**)
* [Create a Docker machine](create_docker_machine.md)
  - To keep using VirtualBox, you can run these commands:
    - `docker-machine create --driver virtualbox`
    - `eval $(docker-machine env default)`
* Determine and set the UAA endpoint:
  - `curl -Ss http://192.168.200.2:8080/api/v1/namespaces/hcp/services/ident-api | jq '.spec.ports[0].nodePort'`
  - In `development.rc`, uncomment the `Local HCP Identity for development` variables and set the following variable:
    - `HCP_IDENTITY_PORT=<IDENT-API-PORT>`
* You now have two options for running the Console:
  1. Use the `stand-up-dev-env.sh` script. For a clean start, run the script with the `-c` flag.
  2. Run the `docker-compose` commands manually. See below for [instructions](#running-ui-manually).
* Get the Docker machine IP: `docker-machine ip default`
* The Console UI should be available at the IP address returned above.
* The HCP UAA endpoint provides two users: `admin@cnap.local` and `user@cnap.local`. You can log into the Console UI with those users. Please ask the HCP team or Console UI team for passwords.

#### <a id="running-ui-manually"></a>Option 2: Run Docker Compose manually ####
* Generate portal-proxy binary. Follow the directions in the repository's [README](https://github.com/hpcloud/portal-proxy):
  - `cd $GOPATH/src/github.com/hpcloud/portal-proxy`
  - Install dependencies
  - Set environmental variables
  - Set up developer certs
  - `./tools/build_portal_proxy.sh`
* Back in stratos-deploy, build and run:
```
docker-compose -f docker-compose.development.yml build
docker-compose -f docker-compose.development.yml up -d
docker logs -f stratosdeploy_ui_1
```
