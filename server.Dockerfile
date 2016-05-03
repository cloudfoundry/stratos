FROM ubuntu:14.04

RUN mkdir -p /srv

WORKDIR /srv

COPY portal-proxy portal-proxy
COPY certs/ certs/

# TODO: This should be removed in favor of env-vars.
COPY portal-config.toml portal-config.toml

RUN chmod +x portal-proxy

EXPOSE 443

ENTRYPOINT ["/srv/portal-proxy"]
