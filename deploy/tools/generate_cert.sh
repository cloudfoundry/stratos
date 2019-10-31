#!/bin/bash

DIRPATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Make sure we add extensions to be compatible with https://support.apple.com/en-us/HT210176

# Settings
devcerts_path=${CERTS_PATH:-portal-proxy-output/dev-certs}
domain=${DEV_CERTS_DOMAIN:-pproxy}

CERT_CONFIG_FILE=${DIRPATH}/stratos_certgen.config

cat <<EOF > ${CERT_CONFIG_FILE}
[ req ]
prompt = no
default_bits        = 2048
distinguished_name  = subject
req_extensions      = v3_req
x509_extensions     = v3_req

[ subject ]
countryName          = GB
stateOrProvinceName  = Bristol
organizationName     = StratosDeveloper
commonName           = 1.2.3.4

[ v3_req ]
authorityKeyIdentifier=keyid,issuer
basicConstraints = CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth, clientAuth
subjectAltName = @alt_names
nsCertType = server

[ alt_names ]
DNS.0 = 1.2.3.4
DNS.1 = 1.2.3.4
EOF

# Generate a key and cert
echo "Generating key and cert for $domain"
mkdir -p ${devcerts_path}

openssl req -config ${CERT_CONFIG_FILE} -new -x509 -nodes -days 365 -newkey rsa:2048 -sha256 -keyout ${devcerts_path}/$domain.key -out ${devcerts_path}/$domain.crt

rm -f ${CERT_CONFIG_FILE}

echo "Certificate generated"
