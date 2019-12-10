#!/usr/bin/env bash

# Cat all of the files
for f in ./coverage/stratos-unittest-*.txt
do
  cat "${f}"
  echo ""
done

cat "./coverage/stratos-unittests.txt"
echo ""

exitCode=$(cat ./coverage/stratos-exitcode.txt)
echo "Exiting with exit code ${exitCode}"
exit ${exitCode}