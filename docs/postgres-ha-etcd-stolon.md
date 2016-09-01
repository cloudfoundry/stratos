# Postgres High Availability (HA) Design/Approach

## Overview
The PostgreSQL database within the Stackato Console is currently used as a storage mechanism for a number of items of interest to Console users. These include http sessions, cnsis and their various endpoints, and tokens of various flavors. Customers expect a good experience around the entry, storage and use of such information, namely that they have to enter this information once and it will be available. Cloud based architectures like ours do not eliminate the opportunity for failures, but they should be very resilient, such that the user isn't even aware they have occurred. One of the ways this is done is via a good HA strategy.

The Console team has operated under the assumption for quite some time that [stolon](https://github.com/sorintlab/stolon) would be the specific tool/component that we would use for Postgres HA. The HCP team recently moved away from stolon due to it's poor support for SSL connections. The Console architecture is such that we do not store sensitive information within the database without encrypting it first, so the need for SSL connections is not a requirement.

Within the [stolon architecture](https://github.com/sorintlab/stolon/blob/master/doc/architecture_small.png), there is the need for a backing store for config related data. Given the choice of [etcd](https://coreos.com/etcd) or [consul](https://www.consul.io/) we chose etcd, mostly due to previous experience by the overall Stackato team and its use within Kubernetes. As a result, the design of Postgres HA for the Console should address both etcd and stolon.

## etcd
TBD

### Links
[Getting Started](https://coreos.com/etcd/docs/latest/getting-started-with-etcd.html)
[etcd under Docker](https://coreos.com/etcd/docs/latest/docker_guide.html)
[etcd Proxy](https://coreos.com/etcd/docs/latest/proxy.html)
[etcd v2](https://www.youtube.com/watch?v=z6tjawXZ71E)
[Bootstrapping etcd](https://www.youtube.com/watch?v=duUTk8xxGbU)
[Running an etcd2 cluster](http://blog.scottlowe.org/2015/04/15/running-etcd-20-cluster/)

## stolon
TBD
