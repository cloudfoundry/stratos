# Postgres High Availability (HA) Design/Approach

## Overview
The PostgreSQL database within the Stackato Console is currently used as a storage mechanism for a number of items of interest to Console users. These include http sessions, cnsis and their various endpoints, and tokens of various flavors. Customers expect a good experience around the entry, storage and use of such information, namely that they will be able to enter this information once and it will be available. Cloud based architectures like ours do not eliminate the opportunity for failures, but they should be very resilient, such that the user isn't even aware they have occurred. One of the ways this is done is via a good HA strategy.

The Console team has operated under the assumption for quite some time that [stolon](https://github.com/sorintlab/stolon) would be the specific tool/component that we would use for Postgres HA. The HCP team recently moved away from stolon due to it's poor support for SSL connections. The Stackato Console doesn't have a requirement that connections to the database utilize TLS/SSL, as we do not store sensitive information within the database without encrypting it first.

[Within the [stolon architecture](https://github.com/sorintlab/stolon/blob/master/doc/architecture_small.png), there is the need for a backing store for config related data. Given the choice of [etcd](https://coreos.com/etcd) or [consul](https://www.consul.io/) we chose etcd, mostly due to previous experience by the overall Stackato team and its use within Kubernetes. As a result, the design of Postgres HA for the Console should address both etcd and stolon.
]
## etcd
etcd is a distributed key value store that provides a reliable way to store data across a cluster of machines. It’s open-source and available on GitHub. etcd gracefully handles leader elections during network partitions and will tolerate machine failure, including the leader.

### Changing the number of instances
By default, etcd is started with 5 nodes in the cluster. This is based on [etcd best practices](https://coreos.com/etcd/docs/latest/admin_guide.html), in the Optimal Cluster Size section. We've chosen to have a cluster size where we can tolerate two nodes going down.

If the cluster size needs to be changes, note the following places where it needs to be changed.

sdl.json:
- in the "hsc-etcd" component section, min_instance & max_instance values should be updated.
- ETCD_INITIAL_CLUSTER, the default value should be updated.
- STPROXY_STORE_ENDPOINTS, the default value should be updated.
- STSENTINEL_STORE_ENDPOINTS, the default value should be updated.
- STKEEPER_STORE_ENDPOINTS, the default value should be updated.

instance.json:
- in the scaling section, under the "hsc-etcd" component, min_instance & max_instance values should be updated.

### Links
[Getting Started](https://coreos.com/etcd/docs/latest/getting-started-with-etcd.html)
[etcd under Docker](https://coreos.com/etcd/docs/latest/docker_guide.html)
[etcd Proxy](https://coreos.com/etcd/docs/latest/proxy.html)
[etcd v2](https://www.youtube.com/watch?v=z6tjawXZ71E)
[etcd small cluster](https://coreos.com/os/docs/latest/cluster-architectures.html#small-cluster)
[Bootstrapping etcd](https://www.youtube.com/watch?v=duUTk8xxGbU)
[Running an etcd2 cluster](http://blog.scottlowe.org/2015/04/15/running-etcd-20-cluster/)


## stolon
stolon is a cloud native PostgreSQL manager for PostgreSQL high availability. It's cloud native because it'll let you keep a high available PostgreSQL inside your containers on every other kind of infrastructure (kubernetes, cloud IaaS, old style infrastructures, etc...)

For an introduction to stolon you can also take a look [at this post](https://sgotti.me/post/stolon-introduction/).

### Changing the number of instances
stolon has three types of nodes:
- sentinel nodes - this node discovers and monitors keepers and calculates the optimal clusterview.
- proxy nodes - the client's access point. It enforce connections to the right PostgreSQL master and forcibly closes connections to unelected masters.
- keeper nodes - these nodes manage a PostgreSQL instance converging to the clusterview provided by the sentinel(s).

Our current configuration includes a cluster composed of single (1) sentinel node, three (3) keeper nodes and a single (1) proxy node. Our SDL has a component for each type of stolon node: "hsc-stsentinel", "hsc-stkeeper", and "hsc-stproxy". In a similar way to the etcd cluster, changing the makeup of the cluster involves changes to both the SDL and IDL.

#### Sentinel nodes
The default number of configured sentinel nodes is a single node. This is done by setting "min_instances" & "max_instances" to 1 for the component in the SDL. There would be no changes required to the IDL as there is no need to scale the number of instances up past 1.

If >1 sentinel nods are required, the above would have to be updated in the SDL and a scaling entry with similar min and max values (akin to the keeper node type) would have to be added.

#### Proxy nodes
The default number of configured proxy nodes is a single node. This is done by setting "min_instances" & "max_instances" to 1 for the component in the SDL. There would be no changes required to the IDL as there is no need to scale the number of instances up past 1.

If >1 proxy nods are required, the above would have to be updated in the SDL and a scaling entry with similar min and max values (akin to the keeper node type) would have to be added.

*Note*: if the number of proxy nodes are increased from a single node, this will affect the overall architecture of the cluster, in that there would no longer be a single point of entry in terms of interacting with the cluster. This sort of change would likely necessitate putting some sort of load balancer in front of the proxy nodes to provide a new single point of entry into the etcd cluster. This is beyond the current scope of our requirements for the Stackato Console.

#### Keeper nodes
The keeper node is a different beast. This node is charged with running the Postgres database in either master or standby/replicated form. As a result, we've chosen to run a total of three containers: one for the master database, and two asynchronously streaming replicated copies, also known as standbys.

sdl.json:
- in the "hsc-stkeeper" component section, min_instance & max_instance values should be updated.

instance.json:
- in the scaling section, under the "hsc-stkeeper" component, min_instance & max_instance values should be updated.

### Links
[stolon on GitHub](https://github.com/sorintlab/stolon)
[stolon architecture](https://github.com/sorintlab/stolon/blob/master/doc/architecture.png)
[cluster configuration](https://github.com/sorintlab/stolon/blob/master/doc/cluster_config.md)
[stolon docker configuration](https://github.com/sorintlab/stolon/tree/master/examples/kubernetes/image/docker)
