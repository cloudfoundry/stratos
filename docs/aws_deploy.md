# Helion Stackato v4.0 Console UI on AWS
In this section, we describe how to set up the Helion Stackato v4.0 Console UI on AWS.


### 1. Create an Ubuntu 14.04 Jumpbox
* Allocate a new Elastic IP address. Save this new address somewhere. It will be used in the next step.

* Create a new keypair or upload an existing keypair.

* Create an access key:
  - Go to IAM > Users
  - Click on your username
  - Under "Security Credentials", click "Create Access Key"

* Add a new VPC using the "Start VPC Wizard" from the VPC dashboard.
  - Make sure to select the "VPC with Public and Private Subnets" tab on the first step of the wizard.

* Edit the public subnet created in the previous step to "Auto-assign Public IP"
  - Navigate to "Subnets"
  - Select your public subnet
  - Click "Subnet Actions" and select "Modify Auto-Assign Public IP"
  - Make sure "Enable auto-assign Public IP" is checked

* Create an instance
  - AMI: Ubuntu Server 14.04 LTS (HVM), SSD Volume Type (ami-9abea4fb in Oregon region)
  - Instance type: t2.micro
  - Subnet: *select public subnet of VPC*
  - Auto-assign Public IP: Enable
  - Create a security group that allows SSH (port 22 inbound)


### 2. Install HCP from the Jumpbox
* Once the jumpbox instance is running, SSH into it.
  Note: Select the instance from the list in the AWS Console and click "Connect". This will show you the correct command to use.

* On the instance, install necessary tools:
  ```
  sudo apt-get update && sudo apt-get install jq curl wget genisoimage
  wget https://s3-us-west-2.amazonaws.com/hcp-concourse/hcp-bootstrap_1.2.7%2Bmaster.748f824.20160702001311_amd64.deb
  sudo dpkg -i <debian bootstrap file name>
  ```

* Create a `bootstrap.properties` file ([template](aws/bootstrap-1.2.7.properties)) and fill in the required properties. Note that if you're going to run HCF on HCP, you will need to upgrade the node instance type to something larger (ex. m4.xlarge).

* Copy your keypair private key file to `/home/ubuntu/.ssh/id_rsa`. Ensure it only has read-only rights.
  ```
  chmod 0400 id_rsa
  ```

* Run boostrap on the jumpbox:
  ```
  bootstrap install bootstrap.properties
  ```

* It will take a while for HCP to install. When it is finished, it will output the locations for the HCP service, identity service, and service manager. You will need these locations to create instances.

* Locate your `hcp-k8s-node` instance and note its private IP and instance ID. The best way is to filter instances by your keypair name.

* SSH into the "node" instance and perform an explicit Docker login:
  ```
  ssh <NODE PRIVATE IP>
  sudo su
  docker login
  ```


### 3. Register the Console UI with Github

* Head over to: https://github.com/settings/developers

* Register the Console as a new developer application
  - Homepage URL: `http://localhost`
  - Authorization callback URL: `http://localhost/pp/v1/github/oauth/callback`


### 4. Install the Console UI

You can now issue the same `curl` commands to install the Console UI using the HCP service location.

The automated build process will push the latest Service Definition (SDL) and Instance Definition (IDL) files suitable for deployment to a Helion Service Manager bucket specific to the Console:

https://console.aws.amazon.com/s3/home?region=us-west-2#&bucket=helion-service-manager&prefix=partner-services/helion-console/

* Update the INSTANCE DEFINITION FILE (instance.json) with values specific to the target environment you are deploying into (local HCP, AWS, etc.)
  - Replace the value for the "GITHUB_OAUTH_CLIENT_ID" with the client ID of the developer application you registered above.
  - Replace the value for the "GITHUB_OAUTH_CLIENT_SECRET" with the client secret of the developer application you registered above.

* Run the following curl commands to deploy the Console. The files below reference Docker images that exist in the shared HPE Docker registry. There are no other files necessary to stand up the Console in your HCP environment.

  ```
  curl -H "Content-Type: application/json" \
       -X POST -d @<SERVICE DEFINITION FILE> \
       <HCP SERVICE LOCATION>/v1/services

  curl -H "Content-Type: application/json" \
       -X POST -d @<INSTANCE DEFINITION FILE> \
       <HCP SERVICE LOCATION>/v1/instances
  ```

* Once the Console is running, find its public endpoint (i.e. load balancer DNS name):
  - Filter load balancers by your `hcp-k8s-node` instance ID.
  - Locate the load balancer that forwards ports 80 and 443. This load balancer should also have a security group (Security tab) that contains `cnap-console-nginx` within its description.
  - Note the DNS name. This is used to update your developer application host in Github and establish a DNS entry in Route53.


### 5. Update the Github developer application URLs

* Head over to: https://github.com/settings/developers

* Edit the developer application you registered above and replace `localhost` with the DNS name you located in the previous step. Alternatively, you can establish a DNS entry in Route53 and use your chosen static URL.


### A. Establish a DNS entry in Route53 (optional)

AWS provides support for DNS thru [Route 53](https://github.com/hpcloud/hdp-resource-manager/blob/develop/cmd/bootstrap/docs/bootstrap.md#load-balancer-support).

This is an optional step, but will allow you to register the application with Github (for the sake of OAuth) using a static URL.

If you don't do this, you will need to update the callback URL with each and every new deploy you do of the Console.


### B. Install Helion Code Engine (optional)

* Download the HSM CLI for your operating system:
  - [OSX](https://helion-service-manager.s3.amazonaws.com/release/master/hsm-cli/dist/0.1.50/hsm-0.1.50-darwin-amd64.tar.gz)
  - [Windows](https://helion-service-manager.s3.amazonaws.com/release/master/hsm-cli/dist/0.1.50/hsm-0.1.50-windows-amd64.zip)
  - [Linux](https://helion-service-manager.s3.amazonaws.com/release/master/hsm-cli/dist/0.1.50/hsm-0.1.50-linux-amd64.tar.gz)

* [Download](https://console.aws.amazon.com/s3/home?region=us-west-2#&bucket=helion-service-manager&prefix=partner-services/hce) the HCE instance definition file.

* Set the HSM API: `./hsm api <Service manager location from Step 1>`

* Set the Docker credentials, SSL cert and key, and mirror cert and key in the `instance.json` file.

* Create the Helion Code Engine instance: `./hsm create-instance hpe-catalog.hpe.hce -i instance.json`

* Wait for all Helion Code Engine pods to be in the "Running" state.

* (Optional) Add an alias (ex. helionce.helion.io) in Route53 using the HCE load balancer endpoint. You can find this by filtering the list by your VPC ID. Then, locate the load balancer with a security group having the HCE service instance ID within its description (ex. helion-code-engine/hce-rest).


### C. Install Helion Cloud Foundry (optional)

* Download the HSM CLI for your operating system:
  - [OSX](https://helion-service-manager.s3.amazonaws.com/release/master/hsm-cli/dist/0.1.50/hsm-0.1.50-darwin-amd64.tar.gz)
  - [Windows](https://helion-service-manager.s3.amazonaws.com/release/master/hsm-cli/dist/0.1.50/hsm-0.1.50-windows-amd64.zip)
  - [Linux](https://helion-service-manager.s3.amazonaws.com/release/master/hsm-cli/dist/0.1.50/hsm-0.1.50-linux-amd64.tar.gz)

* [Download](https://s3-us-west-2.amazonaws.com/helion-service-manager/partner-services/hcf/instance.json) the HCF instance definition file.

* Set the HSM API: `./hsm api <Service manager location from Step 1>`

* Create the HCF instance using the HSM CLI:

  - Edit the file and replace the `DOMAIN` value with an alias (ex. helioncf.helion.io).

  - `./hsm create-instance hpe-catalog.hpe.hcf -i instance.json`

  - When HCF has finished installing, all its pods should be up and running, with the exception of the `post-deployment-setup` pod.

  - Retrieve the HCF service instance ID: `./hsm list-instances | grep hcf`

  - Add the alias (ex `*.helioncf.helion.io`) in Route53 using the HCF load balancer endpoint. You can find this by filtering the list by your VPC ID. Then, locate the load balancer with a security group having the HCF service instance ID within its description (ex. hcf-1467840202/ha-proxy).
