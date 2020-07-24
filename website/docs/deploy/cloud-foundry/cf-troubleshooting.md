---
title: Troubleshooting Cloud Foundry Deployment
sidebar_label: Troubleshooting
---

## Creating logs for recent deployments
To create a log file of the push
```
cf push | tee cfpush.log
```

To create a log file of recent console output
```
cf logs console --recent | tee cfconsole.log
```
>**NOTE** If the name of the application has been changed from `console` in the manifest file please also change the name in the logs statement

## Turning on backend debugging logs

The `LOG_LEVEL` environment variable controls the backend logs 

```
cf set-env console LOG_LEVEL debug 
cf restart console
cf logs console
```

would output more debugging output such as

```
  2018-10-24T14:47:36.91+0200 [RTR/1] OUT console.my.domain - [2018-10-24T12:47:36.850+0000] "GET /pp/v1/-o1F0L956QhAIK7R56Uc1lMh5L4/apps/3ddc0bc6-a645-4449-9d1b-6fe86146cf61/ssh/0 HTTP/1.1" 500 0 0 "-" "Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:60.0) Gecko/20100101 Firefox/60.0" "10.228.194.8:42182" "192.168.35.91:61044" x_forwarded_for:"10.228.194.8" x_forwarded_proto:"https" vcap_request_id:"182dddeb-d877-4d58-45f7-0bd886d1caf6" response_time:0.066925325 app_id:"0ba408ef-d0e6-4ab8-96bb-0bc078b8d8fb" app_index:"0" x_b3_traceid:"d166622a0d612fea" x_b3_spanid:"d166622a0d612fea" x_b3_parentspanid:"-"
   2018-10-24T14:47:36.91+0200 [RTR/1] OUT 
   2018-10-24T14:47:36.85+0200 [APP/PROC/WEB/0] OUT DEBU[Wed Oct 24 12:47:36 UTC 2018] sessionCleanupMiddleware                     
   2018-10-24T14:47:36.85+0200 [APP/PROC/WEB/0] OUT DEBU[Wed Oct 24 12:47:36 UTC 2018] errorLoggingMiddleware                       
   2018-10-24T14:47:36.85+0200 [APP/PROC/WEB/0] OUT INFO[Wed Oct 24 12:47:36 UTC 2018] Not redirecting this request                 
   2018-10-24T14:47:36.85+0200 [APP/PROC/WEB/0] OUT DEBU[Wed Oct 24 12:47:36 UTC 2018] getSession                                   
   2018-10-24T14:47:36.85+0200 [APP/PROC/WEB/0] OUT DEBU[Wed Oct 24 12:47:36 UTC 2018] getSessionValue                              
   2018-10-24T14:47:36.85+0200 [APP/PROC/WEB/0] OUT DEBU[Wed Oct 24 12:47:36 UTC 2018] getSession                                   
   2018-10-24T14:47:36.85+0200 [APP/PROC/WEB/0] OUT DEBU[Wed Oct 24 12:47:36 UTC 2018] setStaticContentHeadersMiddleware            
   2018-10-24T14:47:36.85+0200 [APP/PROC/WEB/0] OUT DEBU[Wed Oct 24 12:47:36 UTC 2018] urlCheckMiddleware                           
   2018-10-24T14:47:36.85+0200 [APP/PROC/WEB/0] OUT DEBU[Wed Oct 24 12:47:36 UTC 2018] sessionMiddleware                            
   2018-10-24T14:47:36.85+0200 [APP/PROC/WEB/0] OUT DEBU[Wed Oct 24 12:47:36 UTC 2018] getSessionValue                              
   2018-10-24T14:47:36.85+0200 [APP/PROC/WEB/0] OUT DEBU[Wed Oct 24 12:47:36 UTC 2018] getSession                                   
   2018-10-24T14:47:36.85+0200 [APP/PROC/WEB/0] OUT DEBU[Wed Oct 24 12:47:36 UTC 2018] xsrfMiddleware                               
   2018-10-24T14:47:36.85+0200 [APP/PROC/WEB/0] OUT DEBU[Wed Oct 24 12:47:36 UTC 2018] GetCNSIRecord                                
   2018-10-24T14:47:36.85+0200 [APP/PROC/WEB/0] OUT DEBU[Wed Oct 24 12:47:36 UTC 2018] Find                                         
   2018-10-24T14:47:36.85+0200 [APP/PROC/WEB/0] OUT DEBU[Wed Oct 24 12:47:36 UTC 2018] decryptToken                                 
   2018-10-24T14:47:36.85+0200 [APP/PROC/WEB/0] OUT DEBU[Wed Oct 24 12:47:36 UTC 2018] Decrypt                                      
   [...]
```

## Application Security Groups

If you have problems when deploying Stratos as a Cloud Foundry application, check that the Application Security Group you have will allow Stratos to communicate with the Cloud Foundry API.

For information on the default ASGs, see [here](https://docs.cloudfoundry.org/concepts/asg.html#default-asg).

To configure a new ASG for the organization and space that are using Stratos, first create a new ASG definition, for example:

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


## Console fails to start

The Stratos Console will automatically detect the API endpoint for your Cloud Foundry. To do so, it relies on the `cf_api` value inside the `VCAP_APPLICATION` environment variable.
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
  buildpack: https://github.com/cloudfoundry/stratos-buildpack
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
  buildpack: https://github.com/cloudfoundry/stratos-buildpack
  health-check-type: port
  env:
    CF_API_FORCE_SECURE: true
```
