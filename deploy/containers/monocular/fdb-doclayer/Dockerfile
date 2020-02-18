
# Original Source: https://raw.githubusercontent.com/kreinecke/fdb-document-layer/master/packaging/docker/Dockerfile

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

# Builder container
FROM splatform/stratos-bk-build-base:leap15_1 as builder

# Install dependencies

# Our Stratos base image already has curl and less in it

# Install FoundationDB Document Layer Binaries

ARG FDB_DOC_VERSION=1.6.3
ARG FDB_WEBSITE=https://www.foundationdb.org

WORKDIR /home/stratos
RUN curl $FDB_WEBSITE/downloads/$FDB_DOC_VERSION/linux/fdb-document-layer-$FDB_DOC_VERSION-Linux.tar.gz -o fdb-document-layer-$FDB_DOC_VERSION-Linux.tar.gz && \
    tar -xvf fdb-document-layer-$FDB_DOC_VERSION-Linux.tar.gz && \
    mv fdb-document-layer-$FDB_DOC_VERSION-Linux doclayer


# This Docker image is just packing 6.0 client libraries. Document Layer works with
# any FoundationDB server >= 5.1.0. If your server version is not 6.0, then you might
# have to add the correct version client library here.
ARG FDB_CLIENT_VERSION=6.2.15
RUN curl $FDB_WEBSITE/downloads/$FDB_CLIENT_VERSION/linux/libfdb_c_$FDB_CLIENT_VERSION.so -o /home/stratos/libfdb_c.so && \
    chmod +x /home/stratos/libfdb_c.so && \
	rm -rf /mnt/website

# Final doclayer container
FROM splatform/stratos-bk-init-base:leap15_1
WORKDIR /var/fdb

COPY --from=builder /home/stratos/libfdb_c.so /usr/lib64/libfdb_c.so
COPY --from=builder /home/stratos/doclayer/bin/fdbdoc /usr/bin/fdbdoc
COPY --from=builder /home/stratos/doclayer/lib/foundationdb/document/fdbmonitor /usr/bin/fdbmonitor

COPY fdbdoc.bash scripts/
RUN chmod u+x scripts/*.bash && mkdir -p logs

CMD /var/fdb/scripts/fdbdoc.bash

# Runtime Configuration Options
ENV FDB_DOC_PORT 27016
ENV FDB_NETWORKING_MODE container