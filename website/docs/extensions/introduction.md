---
title: Extending Stratos
sidebar_label: Introduction
---

Stratos can be customized in a number of ways, from custom branded themes to additional functionality. 

// TODO: RC intro
// TODO: RC stratos.yaml
// TODO: RC custom theme
// TODO: RC custom styles
// TODO: RC custom assets

> Note - For those with existing customization and are migrating to 4.0 please see our [upgrade guide](/docs/extensions/v4-migration).

## Approach

In order to customize Stratos, you will need to fork the Stratos GitHub repository and apply customizations in your fork. Our aim is to minimize any merge conflicts that might occur when re-basing your fork with the upstream Stratos repository.

Frontend Customizations are placed in angular packages in the folder named `src/frontend/packages`. In the future you will be able to host these packages in npm and bring them into Stratos in the usual npm dependency way. There are no additional processes or build steps required for Stratos to then integrate these packages, all steps will be automatically applied during `npm install` and when `ng build`/`ng serve` run under the hood.

Backend (Jetstream) Customizations are written in go and can be added in `src/jetstream/plugins`. In the future we hope to combine this work with the frontend changes, such that all functionality for
a feature can be applied to Stratos in a similar way.

## Examples

Basic examples can be found in the Cloud Foundry Stratos repository for [theming](https://github.com/cloudfoundry/stratos/tree/master/src/frontend/packages/example-theme) and [functionality](https://github.com/cloudfoundry/stratos/tree/master/src/frontend/packages/example-extensions).

More advanced, real world examples can be found the in SUSE Stratos repository, again for [theming](https://github.com/SUSE/stratos/tree/master/src/frontend/packages/suse-theme) and [functionality](https://github.com/SUSE/stratos/tree/master/src/frontend/packages/suse-extensions).

## Further Reading

Detailed instructions on how to customize the [theme](/docs/extensions/theming), [frontend functionality](/docs/extensions/frontend) and [backend](/docs/extensions/backend) can be found in this section.
