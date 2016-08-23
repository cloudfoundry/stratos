FROM quay.io/coreos/etcd:v2.3.7

COPY rsyslog/rsyslog.conf /etc
COPY run.sh /

EXPOSE 2379 2380

CMD [“/run.sh”]
