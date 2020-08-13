FROM {{BASE_IMAGE}}
{{#IS_SLE}}
RUN rm -f /usr/lib/zypp/plugins/services/container-suseconnect-zypp
RUN zypper addrepo -G -c -p 90 '{{ZYP_REPO_BASE_GA}}' base_ga
RUN zypper addrepo -G -c -p 80 '{{ZYP_REPO_BASE_UPDATE}}' base_update
RUN zypper addrepo -G -c -p 70 '{{ZYP_REPO_SP_GA}}' sp_ga
RUN zypper addrepo -G -c -p 60 '{{ZYP_REPO_SP_UPDATE}}' sp_update
RUN zypper addrepo -G -c -p 50 'http://nginx.org/packages/sles/15' nginx
{{/IS_SLE}}

RUN zypper -n ref && \
    zypper -n up && \
    zypper in -y nginx apache2-utils && \
    zypper clean -a && \
    rm -f /var/log/zypper.log /var/log/zypp/history

{{#IS_SLE}}
RUN zypper rr nginx
RUN zypper rr base_ga
RUN zypper rr base_update
RUN zypper rr sp_ga
RUN zypper rr sp_update
{{/IS_SLE}}