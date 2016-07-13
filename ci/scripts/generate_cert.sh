#!/bin/bash

# Settings
pproxy_path=portal-proxy-output
domain=pproxy
commonname=192.168.99.100
country=US
state=Washington
locality=Seattle
organization=HPE
organizationalunit=HDP
email=HPE

# Generate a key and cert
echo "Generating key and cert for $domain"
mkdir $pproxy_path/dev-certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout $pproxy_path/dev-certs/$domain.key -out $pproxy_path/dev-certs/$domain.crt \
  -subj "/C=$country/ST=$state/L=$locality/O=$organization/OU=$organizationalunit/CN=$commonname/emailAddress=$email"
