[Chores]
- Added a modern Concourse pipeline (`ci/`) — gate, nightly audit, and tag-triggered release jobs as thin `make` callers — plus a shared CI tools image (`ghcr.io/cloudfoundry/stratos-ci`) consumed by both Concourse and GitHub Actions.
