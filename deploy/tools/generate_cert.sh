#!/bin/sh

# Settings
devcerts_path=${CERTS_PATH:-portal-proxy-output/dev-certs}
domain=${DEV_CERTS_DOMAIN:-pproxy}
commonname=127.0.0.1
country=UK
state=Bristol
locality=Bristol
organization=SUSE
organizationalunit=CAP
email=SUSE

# Generate a key and cert
echo "Generating key and cert for $domain"
mkdir -p ${devcerts_path}

openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ${devcerts_path}/$domain.key -out ${devcerts_path}/$domain.crt \
  -subj "/C=$country/ST=$state/L=$locality/O=$organization/OU=$organizationalunit/CN=$commonname/emailAddress=$email"
