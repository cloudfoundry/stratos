# $1 is the kubeconfig file

echo "Sonobuoy runner..."
env
echo "Args"
echo $@

echo "Running report..."

# Run the report and wait
sonobuoy run --wait

# Retrieve the report

# Teardown sonobuoy

# Unpack the report and copy the junit report to report.json at the top-level

exit 0
