#!/usr/bin/env bash

# Install custom ca certificate
if [ ! -z ${HCP_CA_CERT_FILE} ]; then
	cp ${HCP_CA_CERT_FILE} /usr/local/share/ca-certificates/hcp_ca.crt
fi

echo "Updating System CA Store"
update-ca-certificates

# Start the Stackato Console Portal Proxy 
/srv/portal-proxy
