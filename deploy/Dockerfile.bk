FROM splatform/stratos-bk-build-base:opensuse as builder
ARG stratos_version
RUN mkdir -p /home/stratos
WORKDIR /home/stratos
COPY --chown=stratos:users . /home/stratos
RUN go version
RUN npm install
RUN npm run build-backend

FROM splatform/stratos-bk-base:opensuse as common-build
COPY --from=builder /home/stratos/src/jetstream/jetstream /srv/
RUN chmod +x /srv/jetstream

# use --target=db-migrator to build db-migrator image
FROM splatform/stratos-bk-base:opensuse as db-migrator
WORKDIR /src
COPY deploy/db/dbconf.yml db/dbconf.yml
COPY deploy/db/scripts/development.sh .
COPY deploy/db/scripts/wait-for-it.sh .
COPY --from=common-build /srv/jetstream .
RUN chmod +x wait-for-it.sh
RUN chmod +x development.sh
CMD bash /src/wait-for-it.sh -t 90 mariadb:3306 && bash /src/development.sh

# use --target=postflight-job to build prod postflight-job
FROM splatform/stratos-bk-base:opensuse as postflight-job
RUN zypper -n in mariadb-client
COPY --from=common-build /srv/jetstream /usr/local/bin/jetstream
COPY deploy/db/dbconf.yml db/dbconf.yml
COPY deploy/db/scripts/run-postflight-job.k8s.sh /run-postflight-job.sh
CMD ["/run-postflight-job.sh"]

# use --target=prod-build to build a backend image for Kubernetes
FROM splatform/stratos-bk-base:opensuse as prod-build
RUN zypper in -y curl
COPY deploy/containers/proxy/entrypoint.sh /entrypoint.sh
COPY /deploy/db/scripts/run-preflight-job.sh /run-preflight-job.sh
COPY /deploy/db/scripts/migrate-volumes.sh /migrate-volumes.sh
COPY /deploy/tools/generate_cert.sh /generate_cert.sh
COPY --from=common-build /srv /srv
RUN mkdir /srv/templates
COPY src/jetstream/templates /srv/templates
EXPOSE 443
ENTRYPOINT ["/entrypoint.sh"]

# use --target=dev-build to build backend image for development
FROM prod-build as dev-build
RUN CERTS_PATH=dev-certs /generate_cert.sh 
