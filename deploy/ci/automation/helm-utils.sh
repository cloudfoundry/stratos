
CYAN="\033[96m"
YELLOW="\033[93m"
RESET="\033[0m"
BOLD="\033[1m"


function deleteRelease {
  helm delete ${NAME} --purge
  kubectl delete namespace ${NAMESPACE}

  local DONE="false"
  while [ $DONE != "true" ]; do
    COUNT=$(kubectl get namespaces | grep ${NAMESPACE} | wc -l)
    if [ $COUNT -eq 0 ]; then
      DONE="true"
    else      
      echo "Waiting for namespace to terminate..."
      sleep 10
    fi
  done
}

function waitForHelmRelease {
  echo "Waiting for Stratos Helm Release to be ready..."
  local DONE="false"
  local TIMEOUT=0
  while [ $DONE != "true" ]; do
    COUNT=$(kubectl get po --namespace=${NAMESPACE} | wc -l)
    kubectl get po --namespace=${NAMESPACE}
    if [ $COUNT -ge 3 ]; then
      # COUNT includes the column header line
      READY=$(kubectl get po --namespace=${NAMESPACE} | grep "Running" | wc -l)
      COMPLETED=$(kubectl get po --namespace=${NAMESPACE} | grep "Completed" | wc -l)
      TOTAL=$(($READY + $COMPLETED))
      EXPECTED=$(($COUNT - 1))
      if [ $TOTAL -eq $EXPECTED ]; then
        READY3=$(kubectl get po --namespace=${NAMESPACE} | grep "3/3" | wc -l)
        READY2=$(kubectl get po --namespace=${NAMESPACE} | grep "2/2" | wc -l)
        READY1=$(kubectl get po --namespace=${NAMESPACE} | grep "1/1" | wc -l)
        READY=$(($READY1 + $READY2 + $READY3))
        if [ $READY -eq 2 ]; then
          DONE="true"
        fi
      fi
    fi
    if [ "$DONE" != "true" ]; then
      echo "Waiting for Stratos Helm release to be ready..."
      sleep 10
      TIMEOUT=$((TIMEOUT+1))
      if [ ${TIMEOUT} -gt 60 ]; then
        echo "Timed out waiting for Helm release to be ready"
        exit 1
      fi
    fi
  done
}

function checkVersion {
  VERS=$1
  STATUS=$(helm list ${NAME} | grep ${NAME})
  STATUS=$(echo $STATUS | awk '{$1=$1};1')
  local HELM_STATUS_REGEX='^([a-z\-]*) ([0-9]*) ([A-Z][a-z][a-z] [A-Z][a-z][a-z] [0-9]* [0-9][0-9]:[0-9][0-9]:[0-9][0-9] [0-9][0-9][0-9][0-9]) ([A-Z]*) ([0-9\.a-z\-]*) ([0-9\.a-z\-]*) ([a-z\-]*)'
  echo -e $STATUS
  if [[ "${STATUS}" =~ ${HELM_STATUS_REGEX} ]]; then
    # 6 is version
    if [ "${BASH_REMATCH[5]}" != "${VERS}" ]; then
      echo "Deployed version number incorrect"
      exit 1
    fi
  else
    echo "Helm status parsing failed"
    exit 1
  fi

  echo "Helm release version ok (${BASH_REMATCH[5]})"
}

function log {
  MSG=$1
  echo -e "${CYAN}${BOLD}"
  echo "========================================================================================================="
  echo "==>> ${MSG}"
  echo "========================================================================================================="
  echo -e "${RESET}"
}
