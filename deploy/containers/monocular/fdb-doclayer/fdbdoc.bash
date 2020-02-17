#! /bin/bash

function setup_cluster_file() {
	FDB_CLUSTER_FILE=${FDB_CLUSTER_FILE:-/etc/foundationdb/fdb.cluster}
	mkdir -p $(dirname $FDB_CLUSTER_FILE)

	if [[ -n $FDB_COORDINATOR ]]; then
		echo "FDB coordinator: $FDB_COORDINATOR"
		coordinator_ip=$(dig +short +search $FDB_COORDINATOR)
		echo "Coordinator IP: $coordinator_ip"
                if [[ -z "$coordinator_ip" ]]; then
                        echo "Failed to look up coordinator address for $FDB_COORDINATOR" 1>&2
                        exit 1
                fi
                coordinator_port=${FDB_COORDINATOR_PORT:-4500}
		if [[ -z $CLUSTER_ID ]]; then
			echo "CLUSTER_ID environment variable not defined" 1>&2
                	exit 1
		fi
                echo "$CLUSTER_ID@$coordinator_ip:$coordinator_port" > $FDB_CLUSTER_FILE
        else
                echo "FDB_COORDINATOR environment variable not defined" 1>&2
                exit 1
        fi


    if [ ! -f ${FDB_CLUSTER_FILE} ]; then
        echo "Failed to locate cluster file at $FDB_CLUSTER_FILE" 1>&2
        exit 1
    fi
}


function setup_public_ip() {
	if [[ "$FDB_NETWORKING_MODE" == "host" ]]; then
		public_ip=127.0.0.1
	elif [[ "$FDB_NETWORKING_MODE" == "container" ]]; then
		public_ip=$(grep `hostname` /etc/hosts | sed -e "s/\s *`hostname`.*//")
	else
		echo "Unknown FDB Networking mode \"$FDB_NETWORKING_MODE\"" 1>&2
		exit 1
	fi

	PUBLIC_IP=$public_ip
}

setup_public_ip
setup_cluster_file

echo "Connecting to FDB server at: $CLUSTER_ID@$coordinator_ip:$coordinator_port"
echo "Cluster file contents: "
cat $FDB_CLUSTER_FILE
if [[ "$ENABLE_TLS" == "true" ]]; then
	echo "Starting FDB Document Layer on $PUBLIC_IP:$FDB_DOC_PORT:tls. TLS enabled."
	fdbdoc -V --listen_address $PUBLIC_IP:$FDB_DOC_PORT:tls --tls_certificate_file $SERVER_CRT --tls_ca_file $CA_CRT --tls_key_file $SERVER_KEY --logdir /var/fdb/logs
else
	echo "Starting FDB Document Layer on $PUBLIC_IP:$FDB_DOC_PORT. No TLS."
	fdbdoc -V --listen_address $PUBLIC_IP:$FDB_DOC_PORT --logdir /var/fdb/logs
fi
