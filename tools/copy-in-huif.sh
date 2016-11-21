#!/bin/sh

# Script to copy in the files from Helion UI Framework
# Run this to test the combined UI + Framework
# This script can be deleted once repos have been combined

UIF_DIR=../../helion-ui-framework
FRAMEWORK_DIR=../framework

command=${1:-copy}

echo "Cleaning out copied in assets from helion-ui-framework"
rm -rf $FRAMEWORK_DIR/theme
rm -rf $FRAMEWORK_DIR/src
rm -rf $FRAMEWORK_DIR/examples/dist
rm -rf $FRAMEWORK_DIR/examples/scripts

if [ $command != "-c" ]; then
  # Need all of the source
  cp -r $UIF_DIR/src $FRAMEWORK_DIR/src

  mkdir $FRAMEWORK_DIR/theme

  # Need theme scss files
  cp -r $UIF_DIR/dist/* $FRAMEWORK_DIR/theme

  # Delete the html files from theme - should not be there
  find $FRAMEWORK_DIR/theme/widgets -name \*.html -exec rm {} \;

  # Just need Script assets for the examples
  cp -r $UIF_DIR/examples/scripts $FRAMEWORK_DIR/examples/scripts

  rm $FRAMEWORK_DIR/src/*.scss
  rm  $FRAMEWORK_DIR/theme/*.scss

  echo "Copied helion-ui-framework assets into startos-ui"
fi