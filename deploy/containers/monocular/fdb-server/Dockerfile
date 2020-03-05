# Taken from: https://github.com/kreinecke/foundationdb/tree/fdb-k8s/packaging/docker

# Dockerfile
#
# This source file is part of the FoundationDB open source project
#
# Copyright 2013-2018 Apple Inc. and the FoundationDB project authors
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

FROM splatform/stratos-bk-build-base:leap15_1 as builder

# Install dependencies

# RUN apt-get update && \
# 	apt-get install -y curl>=7.58.0-2ubuntu3.6 \
# 	dnsutils>=1:9.11.3+dfsg-1ubuntu1.7 && \
# 	rm -r /var/lib/apt/lists/*

# NOTE: Dependencies are in the base image

# Install FoundationDB Binaries

ARG FDB_VERSION=6.2.15
ARG FDB_WEBSITE=https://www.foundationdb.org

USER root
WORKDIR /home/stratos/tmp
WORKDIR /home/stratos
RUN pwd && ls -al
RUN curl $FDB_WEBSITE/downloads/$FDB_VERSION/linux/fdb_$FDB_VERSION.tar.gz -o fdb_$FDB_VERSION.tar.gz && \
	tar -xzf fdb_$FDB_VERSION.tar.gz --strip-components=1 && \
	rm fdb_$FDB_VERSION.tar.gz && \
	chmod u+x fdbbackup fdbcli fdbdr fdbmonitor fdbrestore fdbserver backup_agent dr_agent && \
	mv fdbbackup fdbcli fdbdr fdbmonitor fdbrestore fdbserver backup_agent dr_agent /home/stratos/tmp


# Main container
FROM splatform/stratos-bk-base:leap15_1

WORKDIR /var/fdb

# Install FoundationDB Client Libraries

ARG FDB_VERSION=6.2.15
ARG FDB_ADDITIONAL_VERSIONS="5.1.7"
ARG FDB_WEBSITE=https://www.foundationdb.org

COPY --from=builder /home/stratos/tmp /usr/bin

COPY download_multiversion_libraries.bash scripts/

RUN mkdir -p /mnt/website
RUN curl $FDB_WEBSITE/downloads/$FDB_VERSION/linux/libfdb_c_$FDB_VERSION.so -o /usr/lib/libfdb_c.so && \
	bash scripts/download_multiversion_libraries.bash $FDB_WEBSITE $FDB_ADDITIONAL_VERSIONS && \
	rm -rf /mnt/website

# Set Up Runtime Scripts and Directories

COPY fdb.bash scripts/
COPY create_server_environment.bash scripts/
COPY create_cluster_file.bash scripts/
COPY configure_db.bash scripts/
RUN chmod u+x scripts/*.bash && \
	mkdir -p logs
VOLUME /var/fdb/data

CMD /var/fdb/scripts/fdb.bash

# Runtime Configuration Options

ENV FDB_PORT 4500
ENV FDB_CLUSTER_FILE /var/fdb/fdb.cluster
ENV FDB_NETWORKING_MODE container
ENV FDB_COORDINATOR ""
ENV FDB_COORDINATOR_PORT 4500
ENV FDB_CLUSTER_FILE_CONTENTS ""
ENV FDB_PROCESS_CLASS unset