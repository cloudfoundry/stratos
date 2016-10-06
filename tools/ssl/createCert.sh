#!/bin/bash

set -e

# Declare and check our dependencies
declare -a deps=("openssl")
for dep in "${deps[@]}"; do
	if ! hash ${dep} >/dev/null 2>&1; then
		echo "You must have ${dep} installed before running this script!"
		exit 1
	fi
done

CA_KEY=stackatoCA.key
CA_PEM=stackatoCA.pem
SIGN_REQ=browser-sync.csr
SERVER_KEY=browser-sync.key
SERVER_CERT=browser-sync.crt

rm -vf $CA_KEY $CA_PEM $SERVER_KEY $SERVER_CERT

# Create an OpenSSL certificate authority
#echo "Please enter a password for protecting your CA's private key:"
#read ca_pass
ca_pass=testCAPassword123

openssl genrsa -aes256 -passout pass:${ca_pass} -out ${CA_KEY} 2048

# Create a self signed certificate for the CA
sed -i "s/CN\(\s*\)=\(\s*\).*$/CN\1=\2Stackato Dev Certificate Authority/" openssl.cnf
openssl req -x509 -new -nodes -key ${CA_KEY} -days 1024 -out ${CA_PEM} -passin pass:${ca_pass} -config openssl.cnf

# Create a server certificate for the BrowserSync Server

# First create the private key
openssl genrsa -out ${SERVER_KEY} 2048

# Get a certificate signing request
sed -i "s/CN\(\s*\)=\(\s*\).*$/CN\1=\2localhost/" openssl.cnf
openssl req -new -key ${SERVER_KEY} -out ${SIGN_REQ} -config openssl.cnf

# Finally sign the certificate using our CA
openssl x509 -req -in ${SIGN_REQ} -CA ${CA_PEM} -CAkey ${CA_KEY} -CAcreateserial -out ${SERVER_CERT} -days 500 -passin pass:${ca_pass}

rm ${SIGN_REQ}
