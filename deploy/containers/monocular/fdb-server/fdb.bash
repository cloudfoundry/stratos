#! /bin/bash

#
# fdb.bash
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

source /var/fdb/scripts/create_server_environment.bash
create_server_environment
source /var/fdb/.fdbenv
echo "Starting FDB server listening on: $PUBLIC_IP:$FDB_PORT public address: $PUBLIC_IP:$FDB_PORT"
cat /var/fdb/fdb.cluster
source /var/fdb/scripts/configure_db.bash
configure_db &

if [ -n ${FDB_LISTEN_IP} ]; then
	LISTEN_IP=${FDB_LISTEN_IP}
else
	LISTEN_IP=${PUBLIC_IP}
fi

echo "===================================================================================="
echo "FDB Server starting"
echo "===================================================================================="
echo ""

echo "Listen IP is ${LISTEN_IP}"
echo "Public IP is ${PUBLIC_IP}"

fdbserver --listen_address $LISTEN_IP:$FDB_PORT --public_address $PUBLIC_IP:$FDB_PORT \
	--datadir /var/fdb/data --logdir /var/fdb/logs