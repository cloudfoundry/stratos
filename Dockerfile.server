FROM ubuntu:14.04

RUN mkdir -p /srv

WORKDIR /srv

COPY portal-proxy portal-proxy
COPY ./dev-certs /srv/dev-certs

RUN chmod +x portal-proxy

EXPOSE 443

ENTRYPOINT ["/srv/portal-proxy"]
