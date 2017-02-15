#!/bin/sh
/heapster "--source=kubernetes:https://${KUBELET_HOST}?kubeletPort=${KUBELET_PORT}&kubeletHttps=${KUBELET_HTTPS}" "--sink=opentsdb:http://${OPENTSDB_HOST}:${OPENTSDB_PORT}"
