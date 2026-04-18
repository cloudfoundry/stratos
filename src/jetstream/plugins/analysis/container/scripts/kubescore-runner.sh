#!/usr/bin/env bash
# FWT-923 hardening:
#   - no `bash -c "..."` with interpolated values; use a bash array so the
#     namespace is always a distinct argv element to kubectl
#   - defensive namespace validation against DNS-1123, even though the Go
#     layer in run.go already rejects bad values before the script runs
#
# $1 is the kubeconfig path (written by the Go backend under a trusted folder)
# $2 is the target namespace (empty = --all-namespaces)

set -o pipefail

NAMESPACE="${2:-}"
if [ -n "$NAMESPACE" ]; then
  if ! printf '%s' "$NAMESPACE" | grep -Eq '^[a-z0-9]([-a-z0-9]*[a-z0-9])?$'; then
    echo "Invalid namespace: $NAMESPACE" >&2
    exit 2
  fi
  NS_ARGS=(-n "$NAMESPACE")
else
  NS_ARGS=(--all-namespaces)
fi

echo "Kubescore runner..."
echo "Running report..."

kubectl api-resources --verbs=list --namespaced -o name \
  | while IFS= read -r resource; do
      kubectl get "$resource" "${NS_ARGS[@]}" -oyaml
      echo ---
    done \
  | kube-score score -o json - > report.json

exit 0
