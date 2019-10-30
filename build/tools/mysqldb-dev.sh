#!/usr/bin/env bash

echo "Startind MariaDB database for development"

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

echo "Just waiting a few seconds for the DB to come online ..."
sleep 20

docker exec -t ${ID} /init.sh

echo "Database ready"
