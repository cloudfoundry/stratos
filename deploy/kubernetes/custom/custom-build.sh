# This file is included in the build script

printf "${BOLD}${YELLOW}"
echo
echo "==========================================================================="
echo "SUSE Helm Chart Customization script loaded <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<"
echo "==========================================================================="
echo
printf "${RESET}"

# Script must provide a function named 'custom_image_build'

function custom_image_build() {

  # Build and push an image for the Kubernetes Terminal
  log "-- Building/publishing Kubernetes Terminal"
  patchAndPushImage stratos-kube-terminal Dockerfile.kubeterminal "${STRATOS_PATH}/deploy/containers/kube-terminal"
  
  # Analzyers container
  log "-- Building/publishing Stratos Analyzers"
  patchAndPushImage stratos-analyzers Dockerfile "${STRATOS_PATH}/src/jetstream/plugins/analysis/container"
 
}