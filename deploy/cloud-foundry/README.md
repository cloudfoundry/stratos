# Deploying as a Cloud Foundry Application

## Deployment Steps

The quickest way to install Stratos UI is to deploy it as a Cloud Foundry application. To do so, clone the `stratos` repository, cd into the newly cloned repository and push to Cloud Foundry. This can be done with:

```
git clone https://github.com/cloudfoundry-incubator/stratos
cd stratos
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
3. You may need to configure Application Security Groups on your Cloud Foundry Cluster in order that  Stratos can communicate with the Cloud Foundry API. See [below](#application-security-groups) for more information.
4. The Stratos Console will automatically detect the API endpoint for your Cloud Foundry. To do so, it relies on the `cf_api_url` value inside the `VCAP_APPLICATION` environment variable. If this is not provided by your Cloud Foundry platform, then you must manually update the application manifest as described [below](#console-fails-to-start).

## Associate Cloud Foundry database service
Follow instructions [here](db-migration/README.md).

## Troubleshooting

### Creating logs for recent deployments
To create a log file of the push
```
cf push | tee cfpush.log
```

To create a log file of recent console output
```
cf logs console --recent | tee cfconsole.log
```
>**NOTE** If the name of the application has been changed from `console` in the manifest file please also change the name in the logs statement 

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
  memory: 256M
  disk_quota: 256M
  host: console
  timeout: 180
  buildpack: https://github.com/cloudfoundry-incubator/stratos-buildpack
  health-check-type: port
  env:
    CF_API_URL: https://<<CLOUD FOUNDRY API ENDPOINT>>>
```

#### Setting the `CF_API_FORCE_SECURE` env variable in the manifest

To force the console to use secured communication with the Cloud Foundry API endpoint (HTTPS rather than HTTP), specify the `CF_API_FORCE_SECURE` environment in the manifest, for example:

```
applications:
- name: console
  memory: 256M
  disk_quota: 256M
  host: console
  timeout: 180
  buildpack: https://github.com/cloudfoundry-incubator/stratos-buildpack
  health-check-type: port
  env:
    CF_API_FORCE_SECURE: true
```
