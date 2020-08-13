#!/bin/bash

echo "Building Stratos: Use Prebuild: ${USE_PREBUILT_UI}"

# Use pre-built UI package (speed up building if alreay built)
if [ "${USE_PREBUILT_UI}" = "true" ]; then
  echo "Using pre-built UI: unpacking..."
  unzip stratos-frontend-prebuild.zip -d ./dist
else
  echo "Building frontend"
  npm install
  npm run build
  if [ $? -ne 0 ]; then
    echo "Frontend build failed"
    exit 1
  fi
fi

# Build backend

echo "Building backend"
npm run build-backend
if [ $? -ne 0 ]; then
  echo "Backend build failed"
  exit 1
fi
cp src/jetstream/jetstream .
mv dist ui