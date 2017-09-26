#!/bin/bash
sed -i -e 's@ENCRYPTION_KEY_VOLUME@'"${ENCRYPTION_KEY_VOLUME}"'@g' /etc/nginx/nginx.conf
echo "Checking if certificate has been written to the encryption volume!"
while : 
do 
    if [ -f /${ENCRYPTION_KEY_VOLUME}/console.crt ]; then
        break;
    fi
    sleep 1; 
done
echo "TLS certificate detected continuing, starting nginx."
nginx -g "daemon off;"