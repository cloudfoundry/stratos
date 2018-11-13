Delete deployment:

$ bosh -e vbox delete-deployment -d prometheus



Create Deployment:
$ bosh -d prometheus deploy /workspace/prometheus-boshrelease/manifests/prometheus.yml --vars-store /workspace/prometheus-boshrelease/tmp/deployment-vars.yml -v metrics_environment=cfdev.io -e vbox


Get Instances
 bosh -d prometheus instances -e vbox

 ```
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




Deploy CF monitoring

1. Create the appropriate roles in UAA

```

$ bosh -d prometheus deploy /workspace/prometheus-boshrelease/manifests/prometheus.yml \
  --vars-store /workspace/prometheus-boshrelease/tmp/deployment-vars.yml \
  -o /workspace/prometheus-boshrelease/manifests/operators/monitor-bosh.yml \
  -v bosh_url=192.168.50.6\
  -v bosh_username=admin\
  -v bosh_password=vku8vt6bk0oepc8lltmn\
  --var-file bosh_ca_cert=./ca-cert \
  -v metrics_environment="wss://doppler.local.pcfdev.io:443" \
  -o /workspace/prometheus-boshrelease/manifests/operators/monitor-cf.yml \
  -v system_domain=local.pcfdev.io\
  -v traffic_controller_external_port=443\
  -v skip_ssl_verify=true \
  -v metron_deployment_name=pcfdev\
  -v uaa_clients_cf_exporter_secret=prom_admin_secret\
  -v uaa_clients_firehose_exporter_secret=firehose_exporter_secret\
  -e vbox

  ```