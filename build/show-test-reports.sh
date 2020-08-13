#!/usr/bin/env bash

STRATOS_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd .. && pwd)"

# Colours
CYAN="\033[96m"
YELLOW="\033[93m"
RESET="\033[0m"
BOLD="\033[1m"

echo ""
echo -e "${YELLOW}${BOLD}==========================================================================================="
echo -e "== ${CYAN}STRATOS FRONT-END UNIT TEST RESULTS ${YELLOW}                                                  =="
echo -e "===========================================================================================${RESET}"
echo ""

# Cat all of the files
for f in ${STRATOS_PATH}/coverage/stratos-unittest-*.txt
do
  cat "${f}"
  echo ""
done

cat "${STRATOS_PATH}/coverage/stratos-unittests.txt"
echo ""

if [ ! -f "${STRATOS_PATH}/coverage/stratos-exitcode.txt" ]; then
  echo "ERORR: Exit code file does not exist"
  exit 1
fi

exitCode=$(cat ${STRATOS_PATH}/coverage/stratos-exitcode.txt)
echo "Exiting with exit code ${exitCode}"
exit ${exitCode}