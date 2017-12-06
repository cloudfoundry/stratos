FROM splatform/stratos-db-base:opensuse

COPY mariadb-entrypoint.sh /docker-entrypoint.sh

# ENTRYPOINT
ENTRYPOINT ["/docker-entrypoint.sh"]

EXPOSE 3306
CMD ["mysqld", "--user=mysql"]
