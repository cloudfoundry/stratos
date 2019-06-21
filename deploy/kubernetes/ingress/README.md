# Configuring Ingress

You can make Stratos available via Ingress by following the instructions below.

Ensure that you have Ingress deployed in your Kubernetes environment.

To do this using Helm follow the instructions here: https://github.com/nginxinc/kubernetes-ingress/tree/master/helm-chart.

If you want to use your own certificate, follow the link above for how to do this along with more advanced configuring options.

Briefly, this involves running:

```
git clone git@github.com:nginxinc/kubernetes-ingress.git
cd kubernetes-ingress/helm-chart
helm install --name ingress .
```

Wait for the Ingress controller pod to be in the Running state.

Now, edit the `ingress.xml` in this folder to suit your needs - most likely you will want to change:

- metadata.namespace to the namespace that you using when deploying Stratos

- spec.rules.host and spec.tls.hosts to change the host from stratos.127.0.0.1.xip.io to suit your deployment

Finally, deploy the Ingress configuraation with:

```
kubectl apply -f ./ingress.yml
```

You should now be able to access Stratos via the URL:

```
https://stratos.127.0.0.1.xip.io
```

Note if you changed the host in the ingress.yml file, this URL will of course need to be adjusted.