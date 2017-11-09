## Fissile release for the Stratos UI console

Use the script `build-release.sh` to build and create a Fissile generated Helm chart for the Stratos UI console.

To use the script, specify the external IP of your Kubernetes cluster so that you can access the console instance when it is deployed.

```
$ KUBE_EXTERNAL_IP=10.10.10.11 ./build-release.sh
```

This will create a folder called `fissile-console` which contains the generated Helm chart. To dpeloy it in your cluster, install it with Helm.

```
$ helm install ./fissile-console --namespace console
```

After deployment, the instance will be available at `https://YOUR_KUBE_EXTERNAL_IP:4443`
