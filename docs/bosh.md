## Connecting to Prometheus-boshrelease

### Prerequisites
1. BOSH environment (for developer purposes, see section on deploying this with BOSH Lite)
2. BOSH CLI v2
### Deploying Prometheus-boshrelease

1. Clone the repository
```
$ git clone https://github.com/bosh-prometheus/prometheus-boshrelease
```

We will assume that prometheus-boshrelease has been cloned to the following path: `/workspace/prometheus-boshrelease`


2. Configure UAA

Two UAA clients are required to deploy the prometheus-boshrelease:

| Client Name | UAA Options |
|-------------|-------------|
| cf_exporter | authorised-grant-types: client_credentials,refresh_token, authorities: cloud_controller.admin_read_only, scope: openid,cloud_controller.admin_read_only |
| firehose_exporter | authorised-grant-types: client_credentials,refresh_token, authorities: doppler.firehose, scope: openid,doppler.firehose |

3. If using BOSH Lite, navigate to you `deployments/vbox` directory.

To deploy the prometheus-boshrelease with CF monitoring enabled, execute the following commandm, replace 
```
  bosh -d prometheus deploy /workspace/prometheus-boshrelease/manifests/prometheus.yml \
  --vars-store /workspace/prometheus-boshrelease/tmp/deployment-vars.yml  \
  -o /workspace/prometheus-boshrelease/manifests/operators/monitor-bosh.yml \
  -v bosh_url=<BOSH DIRECTOR IP> \
  -v bosh_username=admin \
  -v bosh_password=<BOSH ADMIN PASSWORD> \
  --var-file bosh_ca_cert=<PATH TO CA CERT FILE> \
  -v metrics_environment="<DOPPLER HOSTNAME WITH PORT>" \
  -o /workspace/prometheus-boshrelease/manifests/operators/monitor-cf.yml \
  -v system_domain=<CF DOMAIN> \
  -v traffic_controller_external_port=<TRAFFIC CONTROLLER PORT> \
  -v skip_ssl_verify=<SKIP SSL VALIDATE> \
  -v metron_deployment_name=<METRON NAME> \
  -v uaa_clients_cf_exporter_secret=<cf_exporter UAA Client SECRET> \
  -v uaa_clients_firehose_exporter_secret=<firehose_exporter UAA Client SECRET \
  -e vbox
```

To determine the external address of Prometheus, list instances:
```
$ bosh -d prometheus instances -e vbox

 Using environment '192.168.50.6' as client 'admin'

Task 14. Done

Deployment 'prometheus'

Instance                                           Process State  AZ  IPs  
alertmanager/6b08de8d-35dc-4d42-9f31-a6bfe5542f79  running        z1  10.244.0.2  
database/c89d2c33-b066-4d21-9b0a-0a3d3b8cc5e8      running        z1  10.244.0.4  
grafana/baa345b9-9814-4824-a512-d13c0792143d       running        z1  10.244.0.5  
nginx/c42e0519-4676-43ef-a369-3a483dec9994         running        z1  10.244.0.6  
prometheus2/908bb835-d081-4985-8db4-c78910ea33a4   running        z1  10.244.0.3  
```

The Prometheus endpoint in this environment is `http://10.244.0.3:9090`
It is recommended that the endpoint should be added to Stratos, after all targets have been discovered and are live. Visit the Status -> Targets in the Prometheys UI to check if at least the `firehose` target is live. Targets are added asynchronously to Prometheus in this environment.

### Delete the deployment

To delete the deployment:
```
$ bosh -e vbox delete-deployment -d prometheus
```

### Debugging the deployment

If some instances are unavailable, logs can be downloaded:
```
$ bosh -e vbox -d prometheus logs
```
This will download a tarball of all logs across all instances.