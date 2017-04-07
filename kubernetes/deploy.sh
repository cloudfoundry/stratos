#!/usr/bin/env bash

CONSOLE_UI_IMAGE=stackatotest/hsc-console:1.0.52-0-gfd0bbd5
CONSOLE_PROXY_IMAGE=stackatotest/hsc-proxy:1.0.534-0-gfd0bbd5
CONSOLE_POSTGRES_IMAGE=stackatodev/hsc-postgres:1.0.37-0-g1ae4b40

CONSOLE_PREFLIGHT_JOB_IMAGE=stackatodev/hsc-preflight-job:1.0.37-0-g1ae4b40
CONSOLE_POSTFLIGHT_JOB_IMAGE=stackatodev/hsc-postflight-job:1.0.37-0-g1ae4b40

HCP_IDENTITY_HOST=console-uaa-int
HCP_IDENTITY_PORT=8080
HCP_IDENTITY_SCHEME=http

PGSQL_PASSWORD=chang3m3

# Create namespace
kubectl create -f console-namespace.yaml
# Create PersistentVolume Resource
#kubectl create -f console-pv.yaml

# Create PersistentVolumeClaims
kubectl create -f console-pvclaims.yaml --namespace=console

# Run pre-flight job - generate the encryption key
kubectl create -f console-preflight-job.yaml --namespace=console

echo "Create preflight job"
read

# Deploy DB
kubectl create -f console-postgres.yaml --namespace=console
echo "Created postgres"
read

# Run pre-flight job - generate the encryption key
kubectl create -f console-postflight.yaml --namespace=console
echo "Create postflight job"
read
# Deploy main deployment
kubectl create -f console-deployment.yaml --namespace=console

