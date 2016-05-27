FROM golang:1.6

# TODO: if we start to use glide (http://glide.sh/) we should only copy over the glide.yml file.
COPY . /go/src/github.com/hpcloud/portal-proxy

WORKDIR /go/src/github.com/hpcloud/portal-proxy

RUN mkdir /root/.ssh
#
# Copy ~/.ssh/* to your portal-proxy folder
#

# Copy ssh key to /root/.ssh
RUN mv id_rsa* /root/.ssh/

# Copy known_hosts to /root/.ssh to suppress host verification failure
RUN mv known_hosts /root/.ssh/known_hosts

RUN git config --global url.git@github.com:.insteadOf https://github.com/

RUN ./tools/on_container_get_deps.sh

# The invoker is expected to mount a volume with our repo's contents at /go/src/portal-proxy

CMD ./tools/on_container_build.sh
