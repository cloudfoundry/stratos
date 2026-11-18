---
id: disable-packages
title: Remove Stratos Packages
sidebar_label: Remove Packages
---

Frontend packages and backend plugins can be removed at build time. They are configured separately: removing a frontend package does
not remove the backend plugins it uses.

All of the methods below act when Stratos is built. A Cloud Foundry push of a release package (`binary_buildpack`) builds nothing
during staging, so set them before running `make build release cf`, not in `manifest.yml`.

## Remove frontend packages

### Via stratos.yaml

Frontend packages can be removed from the build by listing them under `packages.exclude` in `./stratos.yaml` at the repository root.
For example, to exclude Kubernetes and its features:

```
packages:
  exclude:
    - '@stratosui/kubernetes'
```

To keep the file elsewhere, point `STRATOS_YAML` at it.

### Via environment variable

Listing a frontend package in the `STRATOS_BUILD_REMOVE` environment variable has the same effect. Separate several packages with
commas. For example:

```
STRATOS_BUILD_REMOVE=@stratosui/kubernetes make build release cf
```

### By deletion

Deleting a package from `src/frontend/packages` also removes it from the build.

## Remove backend plugins

The backend plugins compiled into Jetstream are listed in [`src/jetstream/plugin-config.yaml`](https://github.com/cloudfoundry/stratos/blob/develop/src/jetstream/plugin-config.yaml).
The plugins in the default [list](https://github.com/cloudfoundry/stratos/blob/develop/src/jetstream/default_plugins.go) are always
included. To remove a plugin, delete its entry from `plugin-config.yaml` before building the backend; `make build backend` regenerates
`extra_plugins.go` from that file. See [Plugin Architecture](../plugin-architecture.md) for details.
