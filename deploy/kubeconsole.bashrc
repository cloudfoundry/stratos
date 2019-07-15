
CYAN="\033[96m"
YELLOW="\033[93m"
GREEN="\033[92m"
RESET="\033[0m"
BOLD="\033[1m"
DIM="\033[2m"

echo -e "${BOLD}${GREEN}SUSE Cloud Application Platform${RESET}"
echo ""
echo -e "${CYAN}Kubernetes Console${RESET}"
echo ""

export KUBECONFIG=/root/.stratos/kubeconfig
export PS1="\033[92mstratos>\033[0m"
alias k=kubectl

helm init --client-only > /dev/null
helm repo remove local > /dev/null
helm repo remove stable > /dev/null

if [ -f "/root/.stratos/helm-setup" ]; then
  echo "Setting up Helm repositories ..."
  source  "/root/.stratos/helm-setup" > /dev/null
  helm repo update 2>&1 > /dev/null
  echo ""
fi


if [ -f "/root/.stratos/history" ]; then
  cat /root/.stratos/history > /root/.bash_history
fi

# Make Bash append rather than overwrite the history on disk:
shopt -s histappend
# A new shell gets the history lines from all previous shells
PROMPT_COMMAND='history -a'
# Don't put duplicate lines in the history.
export HISTCONTROL=ignoredups

echo "Ready"
echo ""
