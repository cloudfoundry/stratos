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

echo "TLS certificate detected ... starting nginx."
nginx -g "daemon off;"
