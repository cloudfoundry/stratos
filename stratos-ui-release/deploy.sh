#! /bin/bash

bosh create-release --force

bosh -e vbox upload-release -d stratos-ui

bosh -e vbox -d stratos deploy bosh-lite/deployment.yml

#bosh -e vbox -d stratos instances
#bosh -e vbox -d stratos ssh frontend/