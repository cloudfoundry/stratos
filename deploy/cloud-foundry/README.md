# Deploying as a Cloud Foundry Application

## Deployment Steps

The quickest way to install Stratos UI is to deploy it as a Cloud Foundry application. To do so, clone the `stratos-ui` repository, cd into the newly cloned repository and push to Cloud Foundry. This can be done with:

```
git clone git@github.com:SUSE/stratos-ui.git
cd stratos-ui
cf push
```

>**NOTE** The console will pre-configure the host Cloud Foundry endpoint. No other CF instance can be registered unless the instructions in the section 'Enable Endpoints Dashboard to register additional Cloud Foundry endpoints' are followed.
 All other deployment methods (helm, docker-compose, docker all-in-one, etc) allow the registration of multiple CF instances by default.

You will then be able to open a web browser and navigate to the console URL:

`https://console.<DOMAIN>`

Where `<DOMAIN>` is the default domain configured for your Cloud Foundry cluster.

To login use the following credentials detailed [here](../../docs/access.md).

If you run into issues, please refer to the [Troubleshooting Guide](#troubleshooting) below.

Note:

1. You need the cf CLI command line tool installed and available on the path.
2. You need to have configured the cf cli to point to your Cloud Foundry cluster, to be authenticated with your credentials and to be targeted at the organization and space where you want the console application be created.
3. You may need to configure Application Security Groups on your Cloud Foundry Cluster in order that  Stratos UI can communicate with the Cloud Foundry API. See [below](#application-security-groups) for more information.
4. The Stratos UI Console will automatically detect the API endpoint for your Cloud Foundry. To do so, it relies on the `cf_api_url` value inside the `VCAP_APPLICATION` environment variable. If this is not provided by your Cloud Foundry platform, then you must manually update the application manifest as described [below](#console-fails-to-start).

## Troubleshooting

### Application Security Groups

If you have problems when deploying Stratos UI as a CLoud Foundry application, check that the Application Security Group you have will allow the Stratos UI to communicate with the Cloud Foundry API.

For information on the default ASGs, see [here](https://docs.cloudfoundry.org/concepts/asg.html#default-asg).

To configure a new ASG for the organization and space that are using for the Stratos UI, first create a new ASG definition, for example:

```
[
   {
      "destination":"0.0.0.0-255.255.255.255",
      "protocol":"all"
   }
]
```

Save this to a file, e.g. `my-asg.json`.

> Note: this allows example all network traffic on all IP ranges - we don't recommend using this.

Unbind the existing ASG for you organization (`ORG`) and space (`SPACE`) with:

```
cf unbind-security-group public_networks ORG SPACE
```

Create a new ASG using the definition you saved to a file and give it a name, with:

```
cf create-security-group NAME my-asg.json
```

Bind this ASG to your `ORG` and `SPACE` with:

```
cf bind-security-group NAME ORG SPACE
```

### Console fails to start

The Stratos UI Console will automatically detect the API endpoint for your Cloud Foundry. To do so, it relies on the `cf_api` value inside the `VCAP_APPLICATION` environment variable.  
To check if the variable is present, use the CF CLI to list environment variables, and inspect the `VCAP_APPLICATION` variable under `System-Provided`. 

```
$ cf env console
Getting env variables for app console in org SUSE / space dev as admin...
OK
 
System-Provided:
 
 
 {
  "VCAP_APPLICATION": {
   "application_id": ...,
   "application_name": "console",
   "application_uris": ...
   "application_version": ...,
   "cf_api": "http://api.cf-dev.io",
   ...
 }
 
 No user-defined env variables have been set
 ...
```

If the `cf_api` environment variable is absent then set the `CF_API_URL` variable. See the following _Setting the `CF_API_URL` env variable in the manifest_ section.


However, if the `cf_api` environment variable is present, and an HTTP address is specified, it is possible that insecure traffic may be blocked. See the following _Setting the `CF_API_FORCE_SECURE` env variable in the manifest_ section.


#### Setting the `CF_API_URL` env variable in the manifest

To specify the Cloud Foundry API endpoint, add the `CF_API_URL` variable to the manifest, for example:

```
applications:
- name: console
  memory: 768M
  disk_quota: 1G
  host: console
  timeout: 180
  buildpack: https://github.com/cloudfoundry-incubator/multi-buildpack
  health-check-type: port
  env:
    CF_API_URL: https://<<CLOUD FOUNDRY API ENDPOINT>>>
```

#### Setting the `CF_API_FORCE_SECURE` env variable in the manifest

To force the console to use secured communication with the Cloud Foundry API endpoint (HTTPS rather than HTTP), specify the `CF_API_FORCE_SECURE` environment in the manifest, for example:

```
applications:
- name: console
  memory: 768M
  disk_quota: 1G
  host: console
  timeout: 180
  buildpack: https://github.com/cloudfoundry-incubator/multi-buildpack
  health-check-type: port
  env:
    CF_API_FORCE_SECURE: true
```

### Enable Endpoints Dashboard to register additional Cloud Foundry endpoints

>**NOTE** This method is meant to demonstrate the capabilities of the console with multiple endpoints and is not meant for production environments

This method comes with two caveats.

1. The console will lose stored data when a cf app instance is restarted
2. Multiple instances of the app will contain multiple separate stored data instances. This will mean the user may connect to a different one with a different storage when revisiting the console.


To enable the dashboard add the environment variable 'FORCE_ENDPOINT_DASHBOARD' to the manifest before the call to 'cf push' is made. For example

```
applications:
- name: console
  memory: 768M
  disk_quota: 1G
  host: console
  timeout: 180
  buildpack: https://github.com/cloudfoundry-incubator/multi-buildpack
  health-check-type: port
  env:
    FORCE_ENDPOINT_DASHBOARD: true
```
