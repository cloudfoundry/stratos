# Stratos CI tools image — the one image every runner (Concourse tasks,
# GitHub Actions `container:`) uses to execute the same `make` targets a
# developer runs. Replaces the legacy node:8 deploy/ci/Dockerfile.concourse.
#
# Contents: node (base) + bun + go toolchain, gh CLI, and the full
# `make audit` scanner set. ZAP is deliberately absent — it joins with
# the DAST workstream (cloudfoundry/stratos#5679).
#
# Published to ghcr.io/cloudfoundry/stratos-ci by
# .github/workflows/ci-image.yml on changes under ci/tools-image/.

FROM node:24-bookworm

# modrot and osv-scanner currently require go >= 1.26.4
ARG GO_VERSION=1.26.5
ARG BUN_VERSION=1.3.14
ARG TARGETARCH=amd64

RUN apt-get update && apt-get install -y --no-install-recommends \
      git make jq zip unzip curl ca-certificates python3-pip \
    && rm -rf /var/lib/apt/lists/*

# gh CLI (make publish, modrot, zizmor online mode)
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
      -o /usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=${TARGETARCH} signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
      > /etc/apt/sources.list.d/github-cli.list \
    && apt-get update && apt-get install -y --no-install-recommends gh \
    && rm -rf /var/lib/apt/lists/*

# Go toolchain
RUN curl -fsSL "https://go.dev/dl/go${GO_VERSION}.linux-${TARGETARCH}.tar.gz" \
      | tar -C /usr/local -xz
ENV PATH=/usr/local/go/bin:${PATH} \
    GOBIN=/usr/local/bin

# Bun (frontend package manager / script runner)
RUN npm install -g "bun@${BUN_VERSION}"

# Go-based scanners (make audit). golangci-lint is deliberately absent —
# no pipeline job runs `make check lint`; add it when a lint job exists.
RUN go install github.com/securego/gosec/v2/cmd/gosec@latest \
    && go install golang.org/x/vuln/cmd/govulncheck@latest \
    && go install github.com/norman-abramovitz/modrot@latest \
    && go install github.com/google/osv-scanner/v2/cmd/osv-scanner@latest \
    && go install github.com/zricethezav/gitleaks/v8@latest \
    && rm -rf /root/go /root/.cache

# trivy (filesystem/config scanner)
RUN curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh \
      | sh -s -- -b /usr/local/bin

# zizmor (GitHub Actions workflow SAST)
RUN pip3 install --no-cache-dir --break-system-packages zizmor
