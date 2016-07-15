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
* Download the [HCP 1.2.7 dev harness](https://s3-us-west-2.amazonaws.com/hcp-concourse/hcp-developer-1.2.7%2Bmaster.748f824.20160702012702.tar.gz)
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

### <a id="install-hce"></a>2. Install Helion Code Engine on HCP
* Download the HSM CLI for your operating system. You will use this to install Helion Code Engine.
  - [OSX](https://helion-service-manager.s3.amazonaws.com/release/master/hsm-cli/dist/0.1.50/hsm-0.1.50-darwin-amd64.tar.gz)
  - [Windows](https://helion-service-manager.s3.amazonaws.com/release/master/hsm-cli/dist/0.1.50/hsm-0.1.50-windows-amd64.zip)
  - [Linux](https://helion-service-manager.s3.amazonaws.com/release/master/hsm-cli/dist/0.1.50/hsm-0.1.50-linux-amd64.tar.gz)
* Set the API: `./hsm api <Service manager location from Step 1>`
* Download the `instance.json` file from the Helion Service Manager S3 bucket specific to [Helion Code Engine](https://console.aws.amazon.com/s3/home?region=us-west-2#&bucket=helion-service-manager&prefix=partner-services/hce).
* Set the Docker credentials, SSL cert and key, and mirror cert and key in the `instance.json` file.
* Create a Helion Code Engine instance: `./hsm create-instance hpe-catalog.hpe.hce -i instance.json`
* Wait for all Helion Code Engine pods to be in the "Running" state.
* Get the port of the "hce-rest" service:
  - `curl http://192.168.200.2:8080/api/v1/namespaces/helion-code-engine/services/hce-rest`
  - You will need this port to register an HCE endpoint in the Console UI

### <a id="register-ui"></a>3. Register the Helion Stackato v4.0 Console UI on Github
* Head over to: https://github.com/settings/developers
* Register the Console UI as a new application
  - Homepage URL: `http://<DOCKER MACHINE IP>` (ex. `192.168.99.100`)
  - Authorization callback URL: `http://<DOCKER MACHINE IP>/pp/v1/github/oauth/callback`
* Set the following environmental variables using the generated client ID and secret:
```
export GITHUB_OAUTH_CLIENT_ID=<CLIENT ID>
export GITHUB_OAUTH_CLIENT_SECRET=<CLIENT SECRET>
```

### <a id="running-ui"></a>4. Running the Helion Stackato v4.0 Console UI
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
  - In `proxy.env`, set the following variables:
    - `CONSOLE_CLIENT=console`
    - `UAA_ENDPOINT=https://192.168.200.3:<IDENT-API-PORT>/oauth/token`
* Generate portal-proxy binary (or use the `stand-up-dev-env.sh` script). Follow the directions in the repo's README.
  - `cd $GOPATH/src/github.com/hpcloud/portal-proxy`
  - `./tools/build_portal_proxy.sh`
* Back in stratos-deploy, build and run (or use the `stand-up-dev-env.sh` script):
```
docker-compose -f docker-compose.development.yml build
docker-compose -f docker-compose.development.yml up -d
docker logs -f stratosdeploy_ui_1
```
* Get the Docker machine IP: `docker-machine ip default`
* The Console UI should be available at the IP address returned above.
* The HCP UAA endpoint provides two users: `admin@cnap.local` and `user@cnap.local`. You can log into the Console UI with those users. Please ask the HCP team or Console UI team for passwords.

#### Helpful Scripts
There are two scripts available for your convenience:
- [stand-up-dev-env.sh](../stand-up-dev-env.sh)
- [cleanup-docker-compose.sh](../cleanup-docker-compose.sh)
