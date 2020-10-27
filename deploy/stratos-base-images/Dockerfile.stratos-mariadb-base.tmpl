FROM {{BASE_IMAGE}}

{{#IS_SLE}}
RUN rm -f /usr/lib/zypp/plugins/services/container-suseconnect-zypp
RUN zypper addrepo -G -c -p 90 '{{ZYP_REPO_BASE_GA}}' base_ga
RUN zypper addrepo -G -c -p 80 '{{ZYP_REPO_BASE_UPDATE}}' base_update
RUN zypper addrepo -G -c -p 70 '{{ZYP_REPO_SP_GA}}' sp_ga
RUN zypper addrepo -G -c -p 60 '{{ZYP_REPO_SP_UPDATE}}' sp_update
RUN zypper ref
{{/IS_SLE}}

# Default password for root of mariadb
ENV MYSQL_ROOT_PASSWORD mysecretpassword

# Install specific version of MariaDB = 10.2.34

# OpenSUSE Leap
{{^IS_SLE}}
RUN zypper in -y curl wget && \
    rpm --import https://yum.mariadb.org/RPM-GPG-KEY-MariaDB && \
    zypper addrepo --gpgcheck --refresh https://yum.mariadb.org/10.2/opensuse/15/x86_64 mariadb
{{/IS_SLE}}

# SLSES
{{#IS_SLE}}
RUN zypper in -y curl wget && \
    rpm --import https://yum.mariadb.org/RPM-GPG-KEY-MariaDB && \
    zypper addrepo --gpgcheck --refresh https://yum.mariadb.org/10.2/sles/15/x86_64 mariadb
{{/IS_SLE}}

# Install packages
RUN zypper --gpg-auto-import-keys refresh && \
    zypper in -y MariaDB-server=10.2.34-1 && \
    zypper in -y MariaDB-client=10.2.34-1

RUN zypper in -y net-tools timezone wget awk grep && \
    zypper clean -a && \
    rm -f /var/log/zypper.log /var/log/zypp/history

# Install from default repository
# RUN zypper in -y mariadb net-tools mariadb-tools timezone wget awk grep && \
#     zypper clean -a && \
#     rm -f /var/log/zypper.log /var/log/zypp/history

ARG GOSU_VERSION=1.11
RUN wget -O /usr/local/bin/gosu "https://github.com/tianon/gosu/releases/download/$GOSU_VERSION/gosu-amd64" \
    && chmod +x /usr/local/bin/gosu

# Config for mariadb
RUN rm -rf /var/lib/mysql \
  && mkdir -p /var/lib/mysql \
  && mkdir -p /var/log/mysql \
  && touch /var/log/mysql/mysqld.log \
  && chown -R mysql:mysql /var/log/mysql

{{#IS_SLE}}
RUN zypper rr base_ga
RUN zypper rr base_update
RUN zypper rr sp_ga
RUN zypper rr sp_update
{{/IS_SLE}}

VOLUME ["/var/lib/mysql"]