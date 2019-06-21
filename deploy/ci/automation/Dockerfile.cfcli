# Dockerfile for image that has the CF CLI installed
FROM opensuse:42.3

RUN zypper -n ref && \
    zypper -n up && \
    zypper in -y curl wget which tar git

RUN curl -L "https://packages.cloudfoundry.org/stable?release=linux64-binary&source=github" | tar -zx && \
    mv cf /usr/local/bin && \
    cf version
