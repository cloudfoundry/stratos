FROM splatform/stratos-bk-build-base:leap15_1 as builder

COPY --chown=stratos:users . /go/src/github.com/helm/monocular
WORKDIR /go/src/github.com/helm/monocular
ARG VERSION
RUN GO111MODULE=on GOPROXY=https://gocenter.io CGO_ENABLED=0 go build -a -installsuffix cgo -ldflags "-X main.version=$VERSION" .

FROM splatform/stratos-bk-base:leap15_1
#COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /go/src/github.com/helm/monocular/chartrepo /chartrepo
USER 1001
CMD ["/chartrepo"]
