FROM alpine:3.6

RUN apk add --update --no-cache ca-certificates git
RUN apk add openssh-client
ENV VERSION v2.5.0
ENV FILENAME helm-${VERSION}-linux-amd64.tar.gz

WORKDIR /

ADD config /root/.ssh/config
ADD http://storage.googleapis.com/kubernetes-helm/${FILENAME} /tmp

RUN tar -zxvf /tmp/${FILENAME} -C /tmp \
  && mv /tmp/linux-amd64/helm /bin/helm \
  && rm -rf /tmp

ENTRYPOINT ["/bin/helm"]
