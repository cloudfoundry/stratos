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

  log "-- Building/publishing Foundation DB Server"
  patchAndPushImage stratos-fdbserver Dockerfile "${STRATOS_PATH}/deploy/containers/monocular/fdb-server"

  log "-- Building/publishing Foundation DB Document Layer"
  patchAndPushImage stratos-fdbdoclayer Dockerfile "${STRATOS_PATH}/deploy/containers/monocular/fdb-doclayer"

  # Build and push an image for the Helm Repo Sync Tool
  log "-- Building/publishing Monocular Chart Repo Sync Tool"
  patchAndPushImage stratos-chartsync Dockerfile "${STRATOS_PATH}/src/jetstream/plugins/monocular/chart-repo"
}