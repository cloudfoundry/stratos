FROM petergrace/opentsdb-docker

# Following parameters are required for deploying this service with Heapster
RUN echo "tsd.http.request.enable_chunked = true" > /etc/opentsdb.conf
RUN echo "tsd.storage.max_tags = 12" >> /etc/opentsdb.conf
RUN echo "tsd.http.request.max_chunk = 40960" >> /etc/opentsdb.conf

# Replace the create_table.sh script to allow overriding the Time-to-live for the tsdb table
ADD create_table.sh /opt/opentsdb/opentsdb-${TSDB_VERSION}/src/create_table.sh
