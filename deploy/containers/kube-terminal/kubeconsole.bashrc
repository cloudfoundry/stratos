
CYAN="\033[96m"
YELLOW="\033[93m"
GREEN="\033[92m"
RESET="\033[0m"
BOLD="\033[1m"
DIM="\033[2m"

echo -e "${BOLD}${GREEN}SUSE Stratos Console${RESET}"
echo ""
echo -e "${CYAN}Kubernetes Terminal${RESET}"
echo ""

# Only do these on first run
if [ ! -f "/stratos/.firstrun" ]; then
  # Unpack helm comand
  gunzip /stratos/helm.gz

  # Need to choose appropriate kubectl version
  pushd /stratos > /dev/null
  # Default to the newwest version that we have
  USE=$(ls kubectl_* | sort -r | head -n1)
  popd > /dev/null

  # If env var K8S_VERSION is set, then use it (major.minor only)
  if [ -n "${K8S_VERSION}" ]; then
    VERSION="kubectl_${K8S_VERSION}.gz"
    if [ -f "/stratos/${VERSION}" ]; then
      USE=${VERSION}
    fi
  fi

  gunzip /stratos/${USE}
  VER=${USE::-3}
  mv /stratos/${VER} /stratos/kubectl
  chmod +x /stratos/kubectl
fi

export PATH=/stratos:$PATH

export KUBECONFIG=${HOME}/.stratos/kubeconfig
export PS1="\033[92mstratos>\033[0m"
alias k=kubectl

# Helm shell completion
source <(helm completion bash)

#helm repo remove stable > /dev/null

if [ ! -f "/stratos/.firstrun" ]; then
  if [ -f "${HOME}/.stratos/helm-setup" ]; then
    echo "Setting up Helm repositories ..."
    source  "${HOME}/.stratos/helm-setup" > /dev/null
    helm repo update 2>&1 > /dev/null
    echo ""
  fi

  if [ -f "${HOME}/.stratos/history" ]; then
    cat ${HOME}/.stratos/history > ${HOME}/.bash_history
  fi
fi

# Make Bash append rather than overwrite the history on disk:
shopt -s histappend
# A new shell gets the history lines from all previous shells
PROMPT_COMMAND='history -a'
# Don't put duplicate lines in the history.
export HISTCONTROL=ignoredups

touch "/stratos/.firstrun"

# Remove any env vars matching KUBERNETES
unset `compgen -A variable | grep KUBERNETES`

echo 
echo -e "Ready - ${CYAN}kubectl${RESET} and ${CYAN}helm${RESET} commands are available"
echo ""
