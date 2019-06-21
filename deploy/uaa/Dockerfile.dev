# See: https://hub.docker.com/r/sequenceiq/uaa/

FROM java:openjdk-8u66-jre

ENV UAA_CONFIG_PATH /uaa
ENV CATALINA_HOME /tomcat
ENV DOWNLOAD_CACHE ./tmp

# UAA Configuration file
ADD uaa.yml /uaa/uaa.yml

#RUN wget -q https://archive.apache.org/dist/tomcat/tomcat-8/v8.0.28/bin/apache-tomcat-8.0.28.tar.gz
#RUN wget -qO- https://archive.apache.org/dist/tomcat/tomcat-8/v8.0.28/bin/apache-tomcat-8.0.28.tar.gz.md5 | md5sum -c -

#ADD https://archive.apache.org/dist/tomcat/tomcat-8/v8.0.28/bin/apache-tomcat-8.0.28.tar.gz .

COPY ./tmp/apache-tomcat-8.0.28.tar.gz .

RUN tar zxf apache-tomcat-8.0.28.tar.gz
RUN rm apache-tomcat-8.0.28.tar.gz

RUN mkdir /tomcat
RUN mv apache-tomcat-8.0.28/* /tomcat
RUN rm -rf /tomcat/webapps/*

#ADD https://github.com/sequenceiq/uaa/releases/download/3.9.3/cloudfoundry-identity-uaa-3.9.3.war /tomcat/webapps/

COPY ./tmp/cloudfoundry-identity-uaa-4.19.0.war /tomcat/webapps/cloudfoundry-identity-uaa-4.19.0.war


RUN mv /tomcat/webapps/cloudfoundry-identity-uaa-4.19.0.war /tomcat/webapps/ROOT.war

EXPOSE 8080

CMD ["/tomcat/bin/catalina.sh", "run"]
