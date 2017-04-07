#!/usr/bin/env bash

kubectl delete deployment console --namespace=console

kubectl delete job preflight-job --namespace=console

kubectl delete namespace console --namespace=console

kubectl delete -f console-pvclaims.yaml --namespace=console

kubectl delete -f console-postgres.yaml --namespace=console
