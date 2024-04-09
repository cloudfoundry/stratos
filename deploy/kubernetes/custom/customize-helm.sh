#!/usr/bin/env bash

# Set imagePullPolicy to IfNotPresent for deployments without registry
sed -i.bak -e 's/imagePullPolicy: Always/imagePullPolicy: IfNotPresent/g' values.yaml
