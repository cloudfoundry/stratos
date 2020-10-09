---
title: Connecting Prometheus-boshrelease to Stratos
sidebar_label: Connecting Prometheus-boshrelease
---

Stratos can show some metrics stored in Prometheus.

A Prometheus server is required with a firehose exporter configured to take metrics from the Cloud Foundry Firehose and store them in the Prometheus server.

One option for deploying and configuring such a Prometheus server is with [prometheus-boshrelease](https://github.com/bosh-prometheus/prometheus-boshrelease.git).

## Configuring Prometheus-boshrelease for use with Stratos

In order for Stratos to work with your Prometheus BOSH release, when deploying `prometheus-boshrelease` you need to set the `metrics_environment` value.

The `metrics_environment` value must be set to the value of the `doppler_logging_endpoint` for your Cloud Foundry, with the prefixing `wss://` protocol removed.

For example, for PCF Dev, you would set the `metrics_environment` value when deploying with bosh, by adding the following to your `bosh deploy` command:

```
-v metrics_environment=doppler.local.pcfdev.io:443
```

Once deployed, you should wait until the `firehose` target is available and its status is `UP`.

## Connecting Prometheus to Stratos

To view metrics within Stratos, you must connect the Prometheus server to Stratos, to do so:

1. Go to the endpoints view
1. Click the '+' icon to register a new endpoint
1. Select the endpoint type `Metrics`
1. Enter a memorable name for your metrics endpoint for the `Name`
1. Enter the URL of the Prometheus server for the `Endpoint Address`
1. Click 'Finish`
1. Click on the three-dot menu icon on the right-hand-side of the endpoint you just added above in the endpoints list and click the menu icon
1. Click 'Connect' in the pop-up menu
1. Change the `Auth Type` to `No Authentication`
1. Check the `Share this endpoint connection` - this allows all users to view metrics using this connection. Note that only Administrators will be able to view Cell metrics and that users can only view Application metrics for applications that they have permissions to view.
1. Click `Connect`

The view should refresh to show the Metrics endpoint. You can click on the endpoint name in the table to show some basic metadata about the metrics endpoint. If everything is configured correctly, it should show you that the metrics endpoint is providing metrics for your Cloud Foundry deployment.

Metrics should now be available on the view for an Application and also on the `Cells` tab of the Cloud Foundry view.

## PCF Dev Example

The instructions below illiustrate how to deploy and configure `prometheus-boshrelease` using bosh-lite and a local PCF Dev deployment.

Follow instructions [here](https://bosh.io/docs/quick-start/) to bring up a local bosh-lite deployment.

Run these two steps to update the deployment and load the stemcell:

```
bosh -e vbox update-cloud-config bosh-deployment/warden/cloud-config.yml
bosh -e vbox upload-stemcell https://bosh.io/d/stemcells/bosh-warden-boshlite-ubuntu-trusty-go_agent?v=3468.17 \
  --sha1 1dad6d85d6e132810439daba7ca05694cec208ab
```

Clone the [prometheus-boshrelease](https://github.com/bosh-prometheus/prometheus-boshrelease) GitHub repository and change directory into it:

```
git clone https://github.com/bosh-prometheus/prometheus-boshrelease.git
cd prometheus-boshrelease
```

You need to create two UAA Clients (ensure you have the `uaac` CLI installed):

```
uaac target https://login.plocal.pcfdev.io --skip-ssl-validation
uaac token client get admin -s admin-client-secret
uaac client add cf_exporter \
  --name cf_exporter \
  --secret prometheus-client-secret \
  --authorized_grant_types client_credentials,refresh_token \
  --authorities cloud_controller.admin_read_only \
  --scope openid,cloud_controller.admin_read_only
uaac client add firehose_exporter \
  --name firehose_exporter \
  --secret prometheus-client-secret \
  --authorized_grant_types client_credentials,refresh_token \
  --authorities doppler.firehose \
  --scope openid,doppler.firehose
```

Store the Bosh CA Certificate in a file:

```
echo $BOSH_CA_CERT > bosh_ca_cert
```

Get the BOSH URL by examining your config file:

```
cat ~/.bosh/config
```

Find the `vbox` environment and make a note of the url field - set an environment variable `BOSH_IP` to this value.

You can now deploy Prometheus Bosh Release with:

```
bosh -d prometheus deploy manifests/prometheus.yml \
  --vars-store tmp/deployment-vars.yml \
  -o manifests/operators/monitor-bosh.yml \
  -v metrics_environment=doppler.local.pcfdev.io:443 \
  -o manifests/operators/monitor-cf.yml \
  -v system_domain=local.pcfdev.io \
  -v metron_deployment_name=local.pcfdev.io \
  -v uaa_clients_cf_exporter_secret=prometheus-client-secret \
  -v uaa_clients_firehose_exporter_secret=prometheus-client-secret \
  -v traffic_controller_external_port=443 \
  -v skip_ssl_verify=true \
  -v bosh_password=${BOSH_CLIENT_SECRET} \
  -v bosh_username=${BOSH_CLIENT} \
  -v bosh_url=https://${BOSH_IP}:25555 \
  --var-file bosh_ca_cert=bosh_ca_cert
```

Wait for deployment to complete.

List the instances in the deployment with:

```
bosh instances -d prometheus
```

Find the IP Address for the `prometheus2` instance. The Prometheus endpoint will be: `http://IP:9090`.

Open a web browser and load the Prometheus URL. open the `Status` menu and select targets. Refresh the page until the firehose target is up.

> Note: It can take a few minutes before all of the targets appear in Prometheus and their state becomes `UP`. You should see targets named `bosh`, `cf` and `firehose` as well as many others if everything is working correctly.

You should now be able to follow the [Connecting Prometheus to Stratos](#connecting-prometheus-to-stratos) instructions for registering and connecting Prometheus to Stratos.
