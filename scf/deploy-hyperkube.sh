#!/bin/sh

# This launches HyperKube locally; it is a temporary workaround until we can
# either get things to work in minikube, or we gave a better structured local
# Kubernetes setup.

# We need to make /var/lib/kubelet shareable with k8s
#
#sudo /home/vagrant/hcf/container-host-files/opt/hcf/bin/docker/configure_docker.sh /dev/sdb 64 4
#/home/vagrant/hcf/container-host-files/opt/hcf/bin/docker/setup_network.sh "172.20.10.0/24" "172.20.10.1"
#
#sudo bash -c 'echo "{\"insecure-registries\":[\"registry.paas-ui:5000\"] }\"" > /etc/docker/daemon.json'
#sudo service docker  restart

curl -sLO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl

sudo mv kubectl /usr/local/bin/
sudo chmod +x /usr/local/bin/kubectl

sudo mkdir -p /var/lib/kubelet
grep -qw '/var/lib/kubelet /var/lib/kubelet' /proc/self/mountinfo || {
    sudo mount --bind /var/lib/kubelet /var/lib/kubelet ;
}
grep -qEw '/var/lib/kubelet [^[:space:]]{1,} shared:1' /proc/self/mountinfo || {
    sudo mount --make-shared /var/lib/kubelet
}

# Everything is ready now
docker run \
    --detach \
    --volume="/sys:/sys:rw" \
    --volume="/var/lib/docker/:/var/lib/docker:rw" \
    --volume="/var/lib/kubelet/:/var/lib/kubelet:rw,shared" \
    --volume="/var/run:/var/run:rw" \
    --net="host" \
    --pid="host" \
    --privileged \
    --name="kubelet" \
    "registry.paas-ui:5000/hyperkube:v1.5.2" \
    /hyperkube kubelet \
        --address="0.0.0.0" \
        --hostname-override="127.0.0.1" \
        --api-servers="http://localhost:8080" \
        --config=/etc/kubernetes/manifests \
        --cluster-dns="10.0.0.10" \
        --cluster-domain="cluster.local" \
        --allow-privileged \
        --v="2"

# Wait for hyperkube to come up
echo "Waiting for Kubernetes to come up..."
while ! kubectl cluster-info 2>/dev/null ; do
    sleep 10
done

# Create the persistent storage class
echo "Creating persistent storage class"
storage_yaml="$(mktemp storage-class.XXXXXXXX.yml)"
trap "rm -f '${storage_yaml}'" EXIT
cat > "${storage_yaml}" <<'EOF'
---
kind: StorageClass
apiVersion: storage.k8s.io/v1beta1
metadata:
  name: persistent
provisioner: kubernetes.io/host-path
EOF
kubectl create -f "${storage_yaml}"

# Install Helm
curl -s https://raw.githubusercontent.com/kubernetes/helm/master/scripts/get > get_helm.sh
chmod 700 get_helm.sh
./get_helm.sh

helm init