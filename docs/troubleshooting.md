# Troubleshooting

## Deploying as a Cloud Foundry Application

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

### node_modules and bower_components

Check the log for deploying Stratos UI with:

```
cf logs console
```

If you see errors relating to bower, check to see if you have local `node_modules` and `bower_components` folders. If you do, delete these and try to push the application again.

