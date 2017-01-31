FROM petergrace/opentsdb-docker
# Following parameters are required for deploying this service with Heapster
RUN echo "tsd.http.request.enable_chunked = true" > /etc/opentsdb.conf
RUN echo "tsd.storage.max_tags = 12" >> /etc/opentsdb.conf
RUN echo "tsd.http.request.max_chunk = 40960" >> /etc/opentsdb.conf
