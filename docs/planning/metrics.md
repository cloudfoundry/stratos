# Metrics

We would like to add Metrics into Stratos.

The goal is to be able to view metrics over time for Applications as well as for aspects of a Cloud Foundry deployment.

The current thinking is that we would deploy Prometheus to collect and store metrics and would use the Cloud Foundry Exporter to channel the data
from the Cloud Foundry firehose into Prometheus.

Since Prometheus does not provide any authentication, we would look to deploy nginx in front of the Prometheus server so that access its API
can be gated. We would most likely use basic authentication and ensure HTTPS access only to the API endpoint.

This basic setup would allow an administrator to deploy Prometheus and configure it to collect metrics from a Cloud Foundry deployment and for APi of Prometheus to be accessed securely.

An intial PoC to get Prometheus deployed with a firehose exported using Helm is here - https://github.com/SUSE/stratos-metrics.

In Stratos, we would add a new endpoint type "Cloud Foundry Metrics" that a user can register with the endpoint of the Prometheus API and then connect to with their credentials as configured above. This would allow the Stratos backend to be able to talk to Prometheus securely and retrieve metrics.

We may need to add some metadata that can be retrieved from Prometheus or the nginx gating it, so that Stratos can determine which Cloud Foundry it is providing metrics for. It may provide metrics for multiple Cloud Foundry deployments.

We will extend the Stratos backend API to allow Prometheus queries to be made via its API. To ensure that a user only sees metrics for entities that they are permitted to see, we would create endpoints along the lines of:

- Metrics for an Application = /metrics/app/{app-id}/query?query=PROMETHEUS_QUERY
- Metrics for Cloud Foundry = /metrics/cf/query?query=PROMETHEUS_QUERY

In the case of Application metrics, the Stratos back-end will first make an API call to Cloud Foundry to retrieve the specified application, in order to determine that the user
is permitted to access the application in question.

In the case of Cloud Foundry metrics, the Stratos back-end will check the user's scopes to ensure that they are an administrator of the Cloud Foundry in question.

### References:

1. https://prometheus.io/docs/prometheus/latest/querying/basics/
2. https://prometheus.io/docs/prometheus/latest/querying/api/
3. https://github.com/bosh-prometheus/firehose_exporter