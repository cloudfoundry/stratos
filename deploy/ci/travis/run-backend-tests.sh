#!/bin/bash

DIRNAME="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${DIRNAME}/instal-go.sh"

npm run test-backend

