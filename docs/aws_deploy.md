# Helion Stackato v4.0 Console UI on AWS
In this section, we describe how to set up the Helion Stackato v4.0 Console UI on AWS.


### <a id="create-jumpbox"></a>1. Create an Ubuntu 14.04 Jumpbox
* Use the Frankfurt region

* Allocate a new Elastic IP address. Save this new address somewhere. It will be used in the next step.

* Create a new keypair or upload an existing keypair.

* If you don't have one, request an access key from Ben Jones \<benj@hpe.com\>

* Add a new VPC using the "Start VPC Wizard" from the VPC dashboard.
  - Make sure to select the "VPC with Public and Private Subnets" tab on the first step of the wizard
  - On step two, give the VPC a name and select the Elastic IP you just created

* Edit the public subnet created in the previous step to "Auto-assign Public IP"
  - Navigate to "Subnets"
  - Select your public subnet (you can search by name)
  - Click "Subnet Actions" and select "Modify Auto-Assign Public IP"
  - Make sure "Enable auto-assign Public IP" is checked

* Create an instance
  - AMI: Ubuntu Server 14.04 LTS (HVM), SSD Volume Type (ami-xxxxx in Frankfurt region)
  - Instance type: t2.micro
  - Subnet: *select public subnet of VPC*
  - Auto-assign Public IP: Enable
  - Create a security group that allows SSH (port 22 inbound)


### <a id="install-hcp"></a>2. Install HCP from the Jumpbox
* Once the jumpbox instance is running, SSH into it.
  Note: Select the instance from the list in the AWS Console and click "Connect". This will show you the correct command to use.

* On the instance, install necessary tools and download the bootstrap you want to install (0.9.11 at time of writing, [latest LKG links found here](https://github.com/hpcloud/cnap/wiki/HCP-Release-Notes)):
  ```
  sudo apt-get update && sudo apt-get install jq curl wget genisoimage -y
  wget https://dev.stackato.com/downloads/hcp/bootstrap/hcp-bootstrap_0.9.11-0-gecf5fae_amd64.deb
  sudo dpkg -i <debian bootstrap file name>
  ```

* Create a `bootstrap.properties` file ([template](https://github.com/hpcloud/hdp-resource-manager/blob/develop/cmd/bootstrap/sample_bootstrap.properties)) and fill in the required properties. Note that if you're going to run HCF on HCP, you will need to upgrade the node instance type to something larger (ex. m4.xlarge).

* Copy your keypair private key file to `/home/ubuntu/.ssh/id_rsa`. Ensure it only has read-only rights.
  ```
  chmod 0400 id_rsa
  ```

* Run boostrap on the jumpbox:
  ```
  bootstrap install bootstrap.properties
  ```

* It will take a while for HCP to install. When it is finished, it will output the locations for the HCP service, identity service, and service manager. You will need these locations to create instances.

* Locate your Kubernetes master `hcp-kubernetes-master-*` and node `hcp-kubernetes-node-*` instances and note their private IPs (normally 10.0.1.x) and instance IDs. The best way is to filter instances by your VPC ID.

### <a id="route53-1"></a>3. Establish DNS entries for HCP, HSM and UAA in Route53

At the end of the bootstrap, you will be told to create DNS entries like such: 
```
INFO[2036] Please create the following DNS entries before installing any services in your Helion Stackato cluster:
INFO[2036]
INFO[2036] hcp.julbra.stacktest.io. IN A ac0e9021e8fce11e6832f06c67c409d5-876003093.eu-central-1.elb.amazonaws.com
INFO[2036] identity.julbra.stacktest.io. IN A ac1de3e788fce11e6832f06c67c409d5-824478633.eu-central-1.elb.amazonaws.com
INFO[2036] *.identity.julbra.stacktest.io. IN CNAME identity.julbra.stacktest.io.
INFO[2036] hsm.julbra.stacktest.io. IN A ac34b8ea38fce11e6832f06c67c409d5-934430935.eu-central-1.elb.amazonaws.com
```
Head over to the [hosted zones](https://console.aws.amazon.com/route53/home?region=eu-central-1#hosted-zones:) in the Route53 section of the AWS console.
If you don't own a hosted zone yet (e.g. it is the first time you deploy in AWS), create yourself a new hosted zone.
Prefer **`.helionteam.com`** and avoid ~~`.stacktest.io`~~ as for some reason **the HSM CLI will not work fom behind the corporate proxy against `.stacktest.io`**.
Choose something that describes the purpose of your deployment, for example `john-dev.helionteam.com`.

Note: if you just created your hosted zone, ping the HCP folks (e.g. @kiall.macinnes) in Slack, they will need to perform some DNS magic before your hosted zone can function properly.
Now click on your hosted zone.

* For each `IN A` entry in the log, create a new record set as follows:
Let's take `hcp.julbra.stacktest.io. IN A ac0e9021e8fce11e6832f06c67c409d5-876003093.eu-central-1.elb.amazonaws.com` as our example.

    * The name should match the first part `hcp`
    * Leave the default type (`A - IPv4 address`)
    * Select Alias `Yes`
    * Click in the alias target text box and wait for entries to populate, then type the first few characters of the ELB name, in our case `ac0e9`
      This should narrow things down to a single result. Select it, leave the default Routing policy (`Simple`) and Evaluate target health (`false`) and click Create

* For the `IN CNAME` entry in the log, create a new record set.
Let's take `*.identity.julbra.stacktest.io. IN CNAME identity.julbra.stacktest.io` as our example.

    * The name should match the first part `*.identity`
    * Change the type to `CNAME - Canonical name`
    * Select Alias `Yes`
    * Type `identity.julbra.stacktest.io` for the Alias Target

### <a id="register-console"></a>4. Register the Console UI with GitHub

* Head over to: https://github.com/settings/developers

* Register the Console as a new developer application using a temporary host:
  - Homepage URL: `http://localhost`
  - Authorization callback URL: `http://localhost/pp/v1/github/oauth/callback`

### <a id="install-console-lkg"></a>5. Install the Console UI via HSM

You can now install the Stackato Console UI using the HSM CLI.

* Download the latest [HSM CLI](https://github.com/hpcloud/cnap/wiki/HSM-Release-Notes) for your machine.

* Set the HSM API: `hsm api <Service manager location from Step 1>`
  (Note: if you chose a .stacktest.io hosted zone, this will not work from behind the firewall. As a workaround you can install the linux CLI will work on the jumpbox)

* Log into HSM: `hsm login --skip-ssl-validation`

* Create the Console instance: `hsm create-instance stackato.hpe.hsc 4.0.0`. HSM will prompt for:
    - an instance name - I normally choose `hsc`
    - the `VCS_CLIENTS` variable - we should all know what to put there but in case, this is a string in the following format:
        * `VCS Provider (string),VCS URL (string),Client ID (string),Client Secret (string),Skip SSL Validation(true|false)`
        * `Client ID` is the Client ID of the OAuth App you registered earlier for the console
        * `Client Secret` is the Client Secret of the OAuth App you registered earlier for the console
        * `Skip SSL Validation` is optional and should be set to true if the VCS uses self-signed certificates (defaults to false)
    
    * VCS_CLIENTS examples:
        - If you plan on only using only the public GitHub:
          `github,https://github.com,ab546f29425d9b02af03,95b5723d4fd2b294774878dd59124d9e10b08178`
    
        - If you plan on only using the public GitHub and a private GitHub Enterprise:
          `github,https://github.com,ab546f29425d9b02af03,95b5723d4fd2b294774878dd59124d9e10b08178;github,https://ec2-52-24-175-73.us-west-2.compute.amazonaws.com,1b828b7466a5cf7548aa,c2f112f2fc22b6836a78a4087f26f23126e75de7,true`

* Wait for all Console pods to be in the "Running" state. This may take a while.
    - `ssh <master private IP>`
    - `watch -n1 kubectl get pods --all-namespaces`

* (Optional) Add an alias (ex. console.stacktest.io) in Route53 using the Console load balancer endpoint. You can find this by filtering the list by your VPC ID. Then, locate the load balancer with a security group that contains Console service instance ID (ex. cnapconsole or hsc) within its description.

### <a id="install-console-latest"></a>5b. Install the Latest Build of Console UI (DEPRECATED)

You can issue the same `curl` commands to install the Console UI using the HCP service location.

The automated build process will push the latest Service Definition (SDL) and Instance Definition (IDL) files suitable for deployment to a Helion Service Manager bucket specific to the Console:

https://console.aws.amazon.com/s3/home?region=us-west-2#&bucket=helion-service-manager&prefix=partner-services/helion-console/

* Update the INSTANCE DEFINITION FILE (instance.json):
  - Replace the value for the `GITHUB_OAUTH_CLIENT_ID` with the client ID of the developer application you registered above.
  - Replace the value for the `GITHUB_OAUTH_CLIENT_SECRET` with the client secret of the developer application you registered above.

* Download the [HCP CLI](https://s3-us-west-2.amazonaws.com/hcp-cli-release/hcp-1.2.18-linux-amd64.tar.gz). You will use this to log into HCP and retrieve the token necessary for installing other services.
* Install the HCP CLI:
```
tar -zxvf hcp-1.2.18-linux-amd64.tar.gz
sudo mv hcp /usr/local/bin
sudo chmod +x /usr/local/bin/hcp
```
* Log into HCP and export the access token:
```
hcp api <HCP service HTTP location from Step 2>
hcp login admin@cnap.local -p <admin@cnap.local password>
export token=$(cat $HOME/.hcp | jq -r .AccessToken)
```
* Add the `publisher` role to the admin user: `hcp update-user admin@cnap.local -r publisher`

* Run the following curl commands (in order) to deploy the Console. The files below reference Docker images that exist in the shared HPE Docker registry. There are no other files necessary to stand up the Console in your HCP environment.

  ```
  curl -H "Content-Type: application/json" -H "Authorization: Bearer $token" \
       -XPOST -d @sdl.json \
       <HCP service HTTP location from Step 2>/v1/services

  curl -H "Content-Type: application/json" -H "Authorization: Bearer $token" \
       -XPOST -d @instance.json \
       <HCP service HTTP location from Step 2>/v1/instances
  ```

* Once the Console is running, find its public endpoint (i.e. load balancer DNS name):
  - Filter load balancers by your `hcp-k8s-node` instance ID from step 2.
  - Locate the load balancer that forwards ports 80 and 443. This load balancer should also have a security group (Security tab) that contains `hsc/hsc-console` within its description.
  - Note the DNS name. This is used to update your developer application host in Github and establish a DNS entry in Route53.


### <a id="update-github"></a>6. Update the Github developer application URLs

* Head over to: https://github.com/settings/developers

* Edit the developer application you registered above and replace `localhost` with the DNS name you located in the previous step. Alternatively, you can establish a DNS entry in Route53 and use your chosen static URL.


### <a id="route53-2"></a>A. Establish a DNS entry in Route53 (optional)

AWS provides support for DNS thru [Route 53](https://github.com/hpcloud/hdp-resource-manager/blob/develop/cmd/bootstrap/docs/bootstrap.md#load-balancer-support).

This is an optional step, but will allow you to register the application with Github (for the sake of OAuth) using a static URL.

If you don't do this, you will need to update the callback URL with each and every new deploy you do of the Console.


### <a id="install-hce"></a>B. Install Helion Code Engine (optional)

* Download the [HSM CLI](https://helion-service-manager.s3.amazonaws.com/release/master/hsm-cli/dist/0.1.73/hsm-0.1.73-linux-amd64.tar.gz).

* [Download](https://helion-service-manager.s3.amazonaws.com/release/master/instance-definition/hce/instance.json) the HCE instance definition file.

* Set the Docker credentials, SSL cert and key, and mirror cert and key in the `instance.json` file.

* Set the HSM API: `hsm api <Service manager location from Step 1>`

* Log into HSM: `hsm login --skip-ssl-validation`

* Create the Helion Code Engine instance: `hsm create-instance hpe-catalog.hpe.hce -i instance.json`

* Wait for all Helion Code Engine pods to be in the "Running" state. This may take a while.
  - `ssh <master private IP>`
  - `watch kubectl get pods --all-namespaces`

* (Optional) Add an alias (ex. helionce.stacktest.io) in Route53 using the HCE load balancer endpoint. You can find this by filtering the list by your VPC ID. Then, locate the load balancer with a security group having the HCE service instance ID within its description (ex. helion-code-engine/hce-rest).


### <a id="install-hcf"></a>C. Install Helion Cloud Foundry (optional)

* Download the [HSM CLI](https://helion-service-manager.s3.amazonaws.com/release/master/hsm-cli/dist/0.1.73/hsm-0.1.73-linux-amd64.tar.gz).

* [Download](https://helion-service-manager.s3.amazonaws.com/release/master/instance-definition/hcf/instance.json) the HCE instance definition file.

* Set the `DOMAIN` parameter with an alias (ex. helioncf.stacktest.io). You'll need to add this alias in Route53 when the install is finished.

* (Optional) Set the `instance_id` parameter (ex. my-hcf-latest). This will also be the namespace.

* Set the HSM API: `hsm api <Service manager location from Step 1>`

* Log into HSM: `hsm login --skip-ssl-validation`

* Create the HCF instance: `hsm create-instance hpe-catalog.hpe.hcf -i instance.json`

* Wait for all HCF pods to be in the "Running" state. This may take a while.
  - `ssh <master private IP>`
  - `watch kubectl get pods --all-namespaces`

* Add the alias (ex `*.helioncf.stacktest.io`) in Route53 using the HCF load balancer endpoint. You can find this by filtering the list by your VPC ID. Then, locate the load balancer with a security group having the HCF service instance ID within its description (ex. my-hcf-cluster/ha-proxy).

### <a id="cleanup-after-yourself"></a>7. Cleanup once you're done

AWS resources are expensive, a deployment like that above uses many nodes and volumes. Cleaning up involves several steps.

* First, download the latest [cleanup.sh script](https://github.com/hpcloud/hdp-resource-manager/blob/develop/devtools/hcp-uninstall.sh) onto your jumpbox.
Run it **twice** with the last deployment log as the argument, for example:
  ```
  ./hcp-uninstall.sh hcp-bootstrap_0.9.12-0-g28e2acc_amd64.deb
  ./hcp-uninstall.sh hcp-bootstrap_0.9.12-0-g28e2acc_amd64.deb
  ```
  _(Note that the first run will fail to delete volumes as they are still attached, the second run will take care of the left-over volumes)_

* Next you need to manually delete the ELB entries. The easiest way is to filter ELB entries by your VPC ID and delete all matches.

* Finally cleanup all the security groups in your VPC that mention Kubernetes or HCP. That is, everything except the default and the first one you created to allow SSH to your jumpbox.
