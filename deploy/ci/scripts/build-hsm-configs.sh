#!/bin/bash
set -eu

SRC=$1
DST=$2
OUT_REGISTRY=$3
OUT_TAG=$4

cd $SRC
for FILE in ./hcp_templates/* ; do
  ofile=$DST/$(basename $FILE)
  cat $FILE | sed s/{{TAG}}/$OUT_TAG/g | sed s/{{REGISTRY}}/$OUT_REGISTRY/g > $ofile
done
cd -
