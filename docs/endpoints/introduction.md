---
title: Stratos Endpoints
sidebar_label: Introduction
---

Stratos uses endpoints to communicate with other systems such as Cloud Foundries, Kubernetes, Helm Repositories, etc. A Stratos Administrator
will register these endpoints in Stratos. All users will then be able to supply credentials per endpoint. Stratos can then communicate with
these systems on behalf of the user.

Multiple endpoints can be registered and connected. Some views in Stratos, like the Cloud Foundry Application page, show amalgamated data
from all endpoints of that type. 

Some endpoints allow credentials to be shared amongst all users, for instance Stratos Metrics 
