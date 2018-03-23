#!/bin/bash
set -e

rm -rf node_modules
npm install
npm run build-backend

# Clean node_modules
rm -rf node_modules
