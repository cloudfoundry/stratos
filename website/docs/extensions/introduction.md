---
title: Extending Stratos
sidebar_label: Introduction
---

Stratos can be customized in a number of ways. Colors and fonts can be updated to add unique branding, additional menu items can be added in a number of places, custom EULAs can be used, new Stratos Jetstream (backend) endpoints, and much more.

> For those with existing customization migrating to 4.0 please see our [upgrade guide](/docs/extensions/v4-migration).

## Approach

In order to customize Stratos, you will need to fork the Stratos GitHub repository and apply customizations in your fork. Our aim is to minimize any merge conflicts that might occur when re-basing your fork with the upstream Stratos repository.

### Frontend

Frontend customizations are placed in angular packages in the folder named `src/frontend/packages`. In the future you will be able to host these packages in npm and bring them into Stratos in the usual npm dependency way. There are no additional processes or build steps required for Stratos to then integrate these packages. All steps will be automatically applied under the hood during `npm install` and when `ng build`/`ng serve` runs.

Information on custom theming can be found in the [theming page](/docs/extensions/theming).

Information on additional functionality can be found in the [extensions page](/docs/extensions/frontend).

### Backend (Jetstream)

Jetstream customizations are written in go and can be added in `src/jetstream/plugins`. In the future we hope to combine this work with the frontend changes, such that all functionality for
a feature can be applied to Stratos in a similar way.

More information can be found in the [custom plugins page](/docs/extensions/backend).

## Examples

### ACME
The ACME example contains a number of [theming](https://github.com/cloudfoundry/stratos/tree/master/src/frontend/packages/example-theme) and [functionality](https://github.com/cloudfoundry/stratos/tree/master/src/frontend/packages/example-extensions)customization.

To run Stratos with these customizations

1. Include the example packages (by default these are excluded). Do this by...
   1. Creating the file `stratos.yaml` in the root of the repo
   2. Adding the following content to `stratos.yaml`
      ```
      packages:
        include:
          - '@stratosui/core'
          - '@stratosui/shared'
          - '@stratosui/store'
          - '@stratosui/cloud-foundry'
          - '@stratosui/cf-autoscaler'
          - '@stratosui/theme'
          - '@example/extensions'
          - '@example/theme'
      ```
1. Run Stratos the usual way, for more information see the [Developer Guide](/docs/developer/introduction).

### SUSE

More advanced, real world examples can be found the in SUSE Stratos repository, again containing [theming](https://github.com/SUSE/stratos/tree/master/src/frontend/packages/suse-theme) and [functionality](https://github.com/SUSE/stratos/tree/master/src/frontend/packages/suse-extensions) customizations.

To run Stratos with these customizations simply start the console the usual way from that repo, for more information see the [Developer Guide](/docs/developer/introduction).

## Further Reading

Detailed instructions on how to customize the [theme](/docs/extensions/theming), [frontend functionality](/docs/extensions/frontend) and [backend](/docs/extensions/backend) can be found in this section.
