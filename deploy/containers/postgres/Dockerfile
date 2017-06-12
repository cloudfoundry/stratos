FROM postgres:9.4.9
RUN mkdir -p /usr/share/doc/suse
COPY LICENSE.txt /usr/share/doc/suse/LICENSE.txt
COPY wrap-docker-entrypoint.sh /wrap-docker-entrypoint.sh
ENTRYPOINT ["/wrap-docker-entrypoint.sh"]
CMD ["postgres"]
