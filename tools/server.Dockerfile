FROM ubuntu:14.04

RUN mkdir -p /srv

WORKDIR /srv

COPY portal-proxy portal-proxy
COPY certs/ certs/

# TODO: This should be removed in favor of env-vars.
COPY portal-config.toml portal-config.toml

RUN chmod +x portal-proxy

# TODO woodnt: Figure out the right ports here.
ENV HOST=0.0.0.0 PORT=8112

ENTRYPOINT ["/srv/portal-proxy"]
