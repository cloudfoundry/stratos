# Docker build for all-in-one Stratos
FROM splatform/stratos-aio-base:opensuse as builder

# Ensure that we copy the custom-src folder
COPY --chown=stratos:users . ./
COPY --chown=stratos:users deploy/tools/generate_cert.sh generate_cert.sh
COPY --chown=stratos:users deploy/all-in-one/config.all-in-one.properties config.properties

RUN npm install \
    && npm run build \
    && npm run build-backend \
    && cp src/jetstream/jetstream . \
    && mv dist ui

# Generate dev-certs
RUN CERTS_PATH=/home/stratos/dev-certs ./generate_cert.sh \
    && chmod +x jetstream

# use --target=aio to build All-in-one image
FROM splatform/stratos-bk-base:opensuse
COPY --from=builder /home/stratos/deploy/db /src/deploy/db
COPY --from=builder /home/stratos/dev-certs /srv/dev-certs
COPY --from=builder /home/stratos/ui /srv/ui
COPY --from=builder /home/stratos/jetstream /srv/jetstream
COPY --from=builder /home/stratos/config.properties /srv/config.properties

EXPOSE 443

# Need to be root to bind to port 443
USER root

ENTRYPOINT ["./jetstream"]
