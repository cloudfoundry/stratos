#!/bin/sh

# Settings
devcerts_path=${DEV_CERTS_PATH:-portal-proxy-output/dev-certs}
domain=pproxy
commonname=192.168.99.100
country=US
state=Washington
locality=Seattle
organization=SUSE
organizationalunit=HDP
email=SUSE

# Generate a key and cert
echo "Generating key and cert for $domain"
mkdir -p ${devcerts_path}
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ${devcerts_path}/$domain.key -out ${devcerts_path}/$domain.crt \
  -subj "/C=$country/ST=$state/L=$locality/O=$organization/OU=$organizationalunit/CN=$commonname/emailAddress=$email"
