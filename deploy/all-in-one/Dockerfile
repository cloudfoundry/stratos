# Thin all-in-one Stratos image.
#
# Reuses the release-built, statically linked (CGO_ENABLED=0) jetstream and
# the prebuilt UI — there is NO in-image source build and no Node/Go toolchain.
# The old deploy/Dockerfile.all-in-one built current source on a leap15_2
# (Node 12) base and broke on the ESM/bun build; this replaces it.
#
# The build context is the staged directory produced by stage-aio.sh:
#   make build frontend
#   make build backend PLATFORM=linux/amd64
#   ./deploy/all-in-one/stage-aio.sh
#   docker build -f deploy/all-in-one/Dockerfile -t stratos-aio dist/aio-package
#
# One image serves both `docker run` (no VCAP -> HTTPS :5443 with dev-certs)
# and `cf push -o <image>` (the cloudfoundryhosting plugin detects
# VCAP_APPLICATION -> HTTP on $PORT). Same binary; runtime decides.
FROM debian:bookworm-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && useradd -M -U -u 2000 jetstream \
 && mkdir -p /srv \
 && chown jetstream:jetstream /srv

WORKDIR /srv

COPY --chown=jetstream:jetstream jetstream ./jetstream
COPY --chown=jetstream:jetstream ui ./ui
COPY --chown=jetstream:jetstream templates ./templates
COPY --chown=jetstream:jetstream plugins.yaml ./plugins.yaml
COPY --chown=jetstream:jetstream config.properties ./config.properties
COPY --chown=jetstream:jetstream dev-certs ./dev-certs

RUN chmod +x ./jetstream

EXPOSE 5443

USER jetstream
ENTRYPOINT ["./jetstream"]
