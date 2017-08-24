## Deploying the BOSH release

To build and deploy the BOSH release you will require a BOSH director. If you don't have one available follow these instructions to setup BOSH lite [here](https://bosh.io/docs/bosh-lite.html).
The rest of the instruction assume that a BOSH lite environment is being used to deploy the chart.


### Deploying in a BOSH lite environment

1. To upload a cloud-config execute the following:
```
$ bosh -e vbox update-cloud-config ~/workspace/bosh-deployment/warden/cloud-config.yml
```

2. Upload a stemcell (using the `bosh-warden-boshlite-ubuntu-trusty`)
```
bosh -e vbox upload-stemcell https://bosh.io/d/stemcells/bosh-warden-boshlite-ubuntu-trusty-go_agent?v=3421.9 \
  --sha1 1396d7877204e630b9e77ae680f492d26607461d
```

3. Build the Stratos UI BOSH release
```
$ bosh create-release
```

If you have outstanding changes locally add the `--force` flag.

4. After a successful build, upload the release to your director.
```
$ bosh -e vbox upload-release -d stratos-ui
```

5. Deploy the release
A sample bosh-lite deployment manifest has been provided in `bosh-lite/deployment.yaml`. The following will use that command to deploy the Console.
```
$ bosh -e vbox -d stratos-ui deploy bosh-lite/deployment.yml
```

6. List deployment

List deployment to get the IP address of the frontend to access the Console. In the following example to access the Console the address is `https://10.0.16.4`.

```
09:10 $ bosh -e vbox -d stratos-ui instances
Using environment '192.168.50.6' as client 'admin'                                                                                                                                                                
                                                                                                                                                                                                                  
Task 22. Done                                                                                                                                                                                                     
                                                                                                                                                                                                                  
Deployment 'stratos-ui'                                                                                                                                                                                              
                                                                                                                                                                                                                  
Instance                                       Process State  AZ  IPs                                                                                                                                             
backend/68580d76-a241-4de2-b246-82d0a184c9bb   running        -   10.0.16.103                                                                                                                                     
frontend/477c94ef-3138-416c-97d7-c09682e6d5dd  running        -   10.0.16.4                                                                                                                                       
                                                                                                                                                                                                                  
2 instances                                                                                                                                                                                                       
                                                                                                                                                                                                                  
Succeeded   
```