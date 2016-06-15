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
  - AMI: Ubuntu Server 14.04 LTS (HVM), SSD Volume Type - ami-9abea4fb
  - Instance type: t2.micro
  - Subnet: *select public subnet of VPC*
  - Auto-assign Public IP: Enable
  - Create a security group that allows SSH (port 22 inbound)

### Install UCP from the Jumpbox
* Once the jumpbox instance is running, SSH into it.
  Note: Select the instance from the list in the AWS Console and click "Connect". This will show you the correct command to use.


* On the instance, install necessary tools:
  ```
  sudo apt-get update && sudo apt-get install jq curl wget
  wget https://s3-us-west-2.amazonaws.com/ucp-concourse/ucp-bootstrap_1.1.22%2Bmaster.50a8819.20160519190312_amd64.deb
  sudo dpkg -i <debian bootstrap file name>
  ```

* Create a `bootstrap.ini` file ([template](bootstrap-1.1.22.ini))

* Copy your `id_rsa` file to `/home/ubuntu/.ssh/id_rsa`. Ensure it only has read-only rights.
  ```
  chmod 0400 id_rsa
  ```

* Run boostrap on the jumpbox:
  ```
  bootstrap --config bootstrap.ini version
  bootstrap --config bootstrap.ini install
  ```
  Note: You will get an error message on completion of the install. This is a known bug for this version. Ignore the error as UCP is actually running.
  ```
  ERRO[0757] Unable to populate initial cluster state: No public ip was found for the node running ipmgr
  No public ip was found for the node running ipmgr
  ```

* Locate your `ucp-k8s-master` and `ucp-k8s-node` hosts in your VPC and find both private IPs. The best way is to filter instances by your keypair name.

* Using the private IP of the master host, get the ipmgr port:
  ```
  curl -Ss \
    http://<MASTER PRIVATE IP>:8080/api/v1/namespaces/ucp/services/ipmgr | \
    jq '.spec.ports[0].nodePort'
  ```

* SSH into the "node" instance and perform an explicit Docker login:
  ```
  ssh <NODE PRIVATE IP>
  sudo su
  docker login
  ```

### Establish a DNS entry in Route53

AWS provides support for DNS thru [Route 53](https://github.com/hpcloud/hdp-resource-manager/blob/develop/cmd/bootstrap/docs/bootstrap.md#load-balancer-support)

This is an option step, but will allow you to [register the application](development.md#register-ui) with Github (for the sake of OAuth) using a static URL.

### Deploy the Console

You can now issue the same `curl` commands to install Helion Code Engine and the Console UI using the master private IP and ipmgr port.

**Please see the "deploy_archives" folder for recent Console UI service definition & instance definition files suitable for deployment.**

Run the following curl commands to deploy the Console. The files below reference docker images that exist in the shared HPE docker registry. There are no other files necessary to stand up the Console in your HCP environment.
```
curl -H "Content-Type: application/json" \
     -X POST -d @<SERVICE DEFINITION FILE> \
     http://<MASTER PRIVATE IP>:<NODE_PORT>/v1/services

curl -H "Content-Type: application/json" \
     -X POST -d @<INSTANCE DEFINITION FILE> \
     http://<MASTER PRIVATE IP>:<NODE_PORT>/v1/instances
```
