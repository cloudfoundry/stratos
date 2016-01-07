FROM node:4.2.3

RUN apt-get update && \
    apt-get install -y openjdk-7-jre-headless && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

CMD [ "/bin/bash" ]
