FROM golang:1.6

# FIXME: Somehow make this relative to THIS FILE instead of relative to where we're calling it from.
# TODO: if we start to use glide (http://glide.sh/) we should only copy over the glide.yml file.
COPY . /go/src/portal-proxy

WORKDIR /go/src/portal-proxy

RUN ./tools/on_container_get_deps.sh

# The invoker is expected to mount a volume with our repo's contents at /go/src/portal-proxy

CMD ./tools/on_container_build.sh
