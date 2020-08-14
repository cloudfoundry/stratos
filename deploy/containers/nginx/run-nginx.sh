#!/bin/bash

echo "============================================"
echo "Stratos UI Container (nginx)"
echo "============================================"
echo ""

sed -i -e 's@CONSOLE_CERT_PATH@'"${CONSOLE_CERT_PATH}"'@g' /etc/nginx/nginx.conf
echo "Checking for certificate at ${CONSOLE_CERT_PATH} ..."

while : 
do 
    if [ -f /${CONSOLE_CERT_PATH}/tls.crt ]; then
        break;
    fi
    sleep 1; 
done

echo "TLS certificate detected OK"

# Patch the config file with the desired ciphers and protocols
echo "Setting nginx ciphers and protocols"

DEFAULT_PROTOCOLS="TLSv1.2 TLSv1.3"
DEFAULT_CIPHERS="HIGH:!aNULL:!MD5"

NGINX_PROTOCOLS=${SSL_PROTOCOLS:-$DEFAULT_PROTOCOLS}
NGINX_CIPHERS=${SSL_CIPHERS:-$DEFAULT_CIPHERS}

echo "SSL Protocols : $NGINX_PROTOCOLS"
echo "SSL Ciphers   : $NGINX_CIPHERS"

sed -e 's/__PROTOCOLS__/'"${NGINX_PROTOCOLS}"'/g' /etc/nginx/nginx.conf.tmpl > /etc/nginx/nginx.conf
sed -i.bak -e 's/__CIPHERS__/'"${NGINX_CIPHERS}"'/g' /etc/nginx/nginx.conf
rm /etc/nginx/nginx.conf.bak

echo "Starting nginx ..."
nginx -g "daemon off;"
