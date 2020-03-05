#! /bin/bash

#
# create_cluster_file.bash
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

# This script creates a cluster file for a server or client.
# This takes the cluster file path from the FDB_CLUSTER_FILE
# environment variable, with a default of /etc/foundationdb/fdb.cluster
#
# The name of the coordinator must be defined in the FDB_COORDINATOR environment
# variable, and it must be a name that can be resolved through DNS.

function configure_db() {
	max_retry=10
	counter=0
	until fdbcli --exec "configure new single memory" | grep 'Database created'
	do
   		sleep 1
   		[[ counter -eq $max_retry ]] && echo "Failed!" && exit 1
   		echo "Could not init db yet. Trying again. Try #$counter"
   		((counter++))
	done
	echo "Database created."
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
	configure_db "$@"
fi