FROM node:8

COPY package.json /
RUN npm install --production
RUN echo 'Europe/London' > /etc/timezone
RUN dpkg-reconfigure --frontend noninteractive tzdata
# Due to a conflict in Gulp 3, we need to run this again
RUN npm install --production
RUN apt-get update && \
    apt-get install -y xvfb wget && \
    apt-get install -y xfonts-100dpi xfonts-75dpi xfonts-scalable xfonts-cyrillic && \
    wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb && \
    dpkg --unpack google-chrome-stable_current_amd64.deb && \
    apt-get install -f -y && \
    apt-get clean && \
    rm google-chrome-stable_current_amd64.deb && \
    rm -rf /var/lib/apt/lists/* && \
    mkdir -p /usr/src/app
