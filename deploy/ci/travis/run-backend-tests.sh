#!/bin/bash

DIRNAME="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${DIRNAME}/install-go.sh"

npm run test-backend
