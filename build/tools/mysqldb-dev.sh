#!/usr/bin/env bash

echo "Starting MariaDB database for development"

STRATOS_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd ../.. && pwd)"
echo $STRATOS_PATH

docker stop stratos-db
docker rm stratos-db

ID=$(docker run --name stratos-db -d -e MYSQL_ROOT_PASSWORD=dbroot -p 3306:3306 splatform/stratos-mariadb)
echo $ID

rm -f dbsetup.sql init.sh
cat <<EOF > dbsetup.sql
CREATE DATABASE stratosdb;
CREATE USER stratos IDENTIFIED BY 'strat0s';
GRANT ALL PRIVILEGES ON stratosdb.* to 'stratos'@'%';
EOF

cat <<EOF > init.sh
#!/usr/bin/env bash
mysql -uroot -pdbroot < /dbsetup.sql
EOF

chmod +x init.sh
docker cp ./dbsetup.sql ${ID}:/dbsetup.sql
docker cp ./init.sh ${ID}:/init.sh
rm dbsetup.sql init.sh

#Fetch dockerize tool
wget https://github.com/jwilder/dockerize/releases/download/v0.6.1/dockerize-linux-amd64-v0.6.1.tar.gz
tar -xzvf dockerize-linux-amd64-v0.6.1.tar.gz
rm dockerize-linux-amd64-v0.6.1.tar.gz

chmod +x ./dockerize
docker cp ./dockerize ${ID}:/dockerize
rm dockerize

#We us wait for the internal socket to come up before running init script
echo "Just waiting a few seconds for the DB to come online ..."
docker exec -t ${ID} /dockerize -wait file:///var/run/mysql/mysql.sock -timeout 1m

docker exec -t ${ID} /init.sh

echo "Database ready"
