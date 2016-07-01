# Helion Stackato v4.0 Console UI on AWS
In this section, we describe how to set up the Helion Stackato v4.0 Console UI on AWS.

### Create an Ubuntu 14.04 Jumpbox
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

### Install HCP from the Jumpbox
* Once the jumpbox instance is running, SSH into it.
  Note: Select the instance from the list in the AWS Console and click "Connect". This will show you the correct command to use.


* On the instance, install necessary tools:
  ```
  sudo apt-get update && sudo apt-get install jq curl wget
  wget https://s3-us-west-2.amazonaws.com/hcp-concourse/hcp-bootstrap_1.2.3%2Bmaster.dd447a0.20160615081232_amd64.deb
  sudo dpkg -i <debian bootstrap file name>
  ```

* Create a `bootstrap.properties` file ([template](bootstrap-1.2.3.properties)) and fill in the required properties. Note that if you're going to run HCF on HCP, you will need to upgrade the node instance type to something larger (ex. m4.xlarge).

* Copy your `id_rsa` file to `/home/ubuntu/.ssh/id_rsa`. Ensure it only has read-only rights.
  ```
  chmod 0400 id_rsa
  ```

* Run boostrap on the jumpbox:
  ```
  bootstrap install bootstrap.properties
  ```

* Locate your `hcp-k8s-master` and `hcp-k8s-node` hosts in your VPC and find both private IPs. The best way is to filter instances by your keypair name.

* Using the private IP of the master host, get the ipmgr port:
  ```
  curl -Ss \
    http://<MASTER PRIVATE IP>:8080/api/v1/namespaces/hcp/services/ipmgr | \
    jq '.spec.ports[0].nodePort'
  ```

* SSH into the "node" instance and perform an explicit Docker login:
  ```
  ssh <NODE PRIVATE IP>
  sudo su
  docker login
  ```

### Establish a DNS entry in Route53 (optional)

AWS provides support for DNS thru [Route 53](https://github.com/hpcloud/hdp-resource-manager/blob/develop/cmd/bootstrap/docs/bootstrap.md#load-balancer-support)

This is an optional step, but will allow you to [register the application](development.md#register-ui) with Github (for the sake of OAuth) using a static URL.

If you don't do this, you will need to update the callback URL with each and every new deploy you do of the Console.

### Deploy the Console

You can now issue the same `curl` commands to install the Console UI using the master private IP and ipmgr port.

The automated build process will push the latest Service Definition (SDL) and Instance Definition (IDL) files suitable for deployment to an Helion Service Manager bucket specific to the Console:

https://console.aws.amazon.com/s3/home?region=us-west-2#&bucket=helion-service-manager&prefix=partner-services/helion-console/

* Update the INSTANCE DEFINITION FILE (instance.json) with values specific to the target environment you are deploying into (local HCP, AWS, etc.)

  - Replace the value for the "GITHUB_OAUTH_CLIENT_ID" with the client ID of the developer application you created when you [register the application](development.md#register-ui)

  - Replace the value for the "GITHUB_OAUTH_CLIENT_SECRET" with the client secret of the developer application you created when you [register the application](development.md#register-ui)

* Run the following curl commands to deploy the Console. The files below reference docker images that exist in the shared HPE docker registry. There are no other files necessary to stand up the Console in your HCP environment.

  ```
  curl -H "Content-Type: application/json" \
       -X POST -d @<SERVICE DEFINITION FILE> \
       http://<NODE PRIVATE IP>:<IPMGR_PORT>/v1/services

  curl -H "Content-Type: application/json" \
       -X POST -d @<INSTANCE DEFINITION FILE> \
       http://<NODE PRIVATE IP>:<IPMGR_PORT>/v1/instances
  ```
