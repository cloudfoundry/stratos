ARGS="--all-namespaces"

if [ -n "$2" ]; then
  ARGS="-n ${2}"
fi

# $1 is the kubeconfig file

echo "Kubescore runner..."
echo "Running report..."

kubectl api-resources --verbs=list --namespaced -o name \
  | xargs -n1 -I{} bash -c "kubectl get {} $ARGS -oyaml && echo ---" \
  | kube-score score -o json - > report.json

exit 0
