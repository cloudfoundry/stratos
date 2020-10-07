FROM splatform/stratos-bk-build-base:leap15_1 as builder

# Build the API Server for the analysis engines

RUN mkdir -p /home/stratos/go/src
WORKDIR /home/stratos/go/src
COPY --chown=stratos:users . /home/stratos/go/src
ARG VERSION=1.0.0
RUN GO111MODULE=on go build -o stratos-analyzers -ldflags -X=main.appVersion=${VERSION}

# Download the Analysis tools
WORKDIR /home/stratos/analysis
WORKDIR /home/stratos/tmp
USER root

# Analyzers ====================================================================================================================


# Popeye
ARG POPEYE_VERSION=0.6.2
# Download archive - popeye executable is in main dir - move it to the analysis folder
RUN wget https://github.com/derailed/popeye/releases/download/v${POPEYE_VERSION}/popeye_${POPEYE_VERSION}_Linux_x86_64.tar.gz && \
    tar -xvf popeye_${POPEYE_VERSION}_Linux_x86_64.tar.gz && \
    mv popeye ../analysis

# Kube-score
ARG KUBESCORE_VERSION=1.5.0
RUN wget https://github.com/zegl/kube-score/releases/download/v${KUBESCORE_VERSION}/kube-score_${KUBESCORE_VERSION}_linux_amd64.tar.gz && \
    tar -xvf kube-score_${KUBESCORE_VERSION}_linux_amd64.tar.gz && \
    mv kube-score ../analysis

# Sonobuoy
# ARG SONOBUOY_VERSION=0.17.2
# RUN wget https://github.com/vmware-tanzu/sonobuoy/releases/download/v${SONOBUOY_VERSION}/sonobuoy_${SONOBUOY_VERSION}_linux_amd64.tar.gz && \
#     tar -xvf sonobuoy_${SONOBUOY_VERSION}_linux_amd64.tar.gz && \
#     mv sonobuoy ../analysis

# Need kubectl for Kubescore - TODO: Use correct version depending on cluster
ARG KUBECTL_VERSION=1.16.2
RUN wget https://storage.googleapis.com/kubernetes-release/release/v${KUBECTL_VERSION}/bin/linux/amd64/kubectl && \
    chmod +x kubectl && \
    mv kubectl ../analysis

# klar
# ARG KLAR_VERSION=2.4.0
# RUN wget https://github.com/optiopay/klar/releases/download/v${KLAR_VERSION}/klar-${KLAR_VERSION}-linux-amd64 && \
#     mv klar-${KLAR_VERSION}-linux-amd64 klar && \
#     chmod +x klar && \
#     mv klar ../analysis

# Final Container =============================================================================================================

FROM splatform/stratos-bk-base:leap15_1

# Copy tools to the /usr/bin folder so that they are in the path
COPY --from=builder /home/stratos/analysis /usr/bin
COPY --from=builder /home/stratos/go/src/stratos-analyzers /stratos-analyzers
COPY ./scripts /scripts
RUN mkdir /reports

CMD ["/stratos-analyzers"]
