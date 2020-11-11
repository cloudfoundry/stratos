---
id: disable-packages
title: Remove Stratos Packages
sidebar_label: Remove Packages
---

Frontend packages and their associated backend plugins can be removed at build time via configuration.

## Frontend Package to Backend Plugin Dependencies

Stratos NPM packages define a list of backend plugins that they require in order to function. These are found in the package's `package.json` in
the `stratos` section `backend` property. For instance the [Stratos Cloud Foundry](https://github.com/cloudfoundry/stratos/blob/master/src/frontend/packages/cloud-foundry/package.json)
 package depends on multiple backend plugins.

If a backend package is not referenced by a package that is built and is not in the 'default' plugins [list](https://github.com/cloudfoundry/stratos/blob/master/src/jetstream/default_plugins.go)
 then it will not be included in the backend build. Therefore omitting a frontend package will also most likely remove it's dependent plugins.

:::important
To ensure backend plugins are excluded correctly the npm target `prepare-backend` should run before building the backend the usual way with
 `build-backend`. If pushing Stratos to Cloud Foundry this step will be completed automatically after `npm install` runs within the buildpack.
:::

## Remove via stratos.yaml
Frontend packages can be removed from the build by adding them to the `excludes` section of `./stratos.yaml`. For example, to exclude
kubernetes and associated features add the kubernetes package to the excludes section before Stratos builds.

```
packages:
  exclude:
    - '@stratosui/kubernetes'
```

## Remove via environment variable
Similarly to adding to the exclude section in stratos.yaml, added a frontend package to the `STRATOS_BUILD_REMOVE` environment variable will
 achieve the same outcome but easier to use when pushing Stratos to Cloud Foundry. For instance updating the env section of your `manifest.yml`
 file as follows will exclude kubernetes and associated features from the build.

```
applications:
  - name: console
    <snip>
    env:
      STRATOS_BUILD_REMOVE: "@stratosui/kubernetes"
```
## Remove by deletion
Functionality can be removed by simply deleting the package from the folder structure. This should have the same effect as both methods above,
 including automatically excluding any unreferences backend plugins.
