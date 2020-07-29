---
title: Migrating to V4
sidebar_label:  Migrating to V4
---

In version 4 of Stratos there are breaking customization changes from previous versions. These changes allow a much improved approach to
extensions by opening the door to npm style plugins. 

Prominent changes include
- `custom-src` has been removed along with the symlink approach of including files. Custom code is now added as npm packages in `src/frontend/packages`.
Modules and routes are now exposed in a more standard package way. More info [here](/docs/extensions/frontend#including-modules-and-routes).
Some existing components will not be included in some production style builds without also declaring them to the extension service, see 
usages of `ExtensionService.declare`.
- Material Design theming approach has been expanded to include many common colors, this removes the need to apply custom styles in a lot of cases. More info [here](/docs/extensions/theming#colors).
- Dark theme is applied in a different way. More info [here](/docs/extensions/theming#dark-theme).
- Image assets are replaced in a different way. More info [here](/docs/extensions/theming#images).
- Custom component can now be themed, so theme colors can be accessed from within and applied. More info [here](/docs/extensions/theming#components).
- A new 'loading' indicator has been added that you may wish to customize, more info [here](/docs/extensions/frontend#loading-indicator).

## Basic Migration Steps
To aid in migrating we've provided these instructions.

1. Before updating to the latest code...
    - Run `npm run customize-reset` to remove all previously created sym links.
    - Read through the customization documentation below to get a better understanding of the new process.
1. Update your codebase with the desired v4 code.
1. Run `npm install` (only required first time, this will ensure you have the required version of Angular and the new devkit is built).
1. Change directory to `./build/tools/v4-migration` and run the migration script `./migrate.sh`.
    - This will copy your customizations from `custom-src` to a new Angular package `src/frontend/packages/custom_extensions`.
1. Check that the new package exports your custom module and if applicable your custom-routing module.
    - The migrate script should do this in `src/frontend/packages/custom_extensions/src/public-api.ts`.
1. Check that your ts config file defines the public api file.
    - `src/tsconfig.json` file's `compilerOptions/paths` section should contain something like `"@custom/extensions": ["frontend/packages/custom_extensions/src/public-api.ts"]`.
1. Check that your new package's `package.json` defines your custom module and if applicable custom-routing module.
    - See `src/frontend/packages/suse-extensions/package.json` file's `stratos` section.
    - Note your `routingModule` entry label should not have a preceding `_`.
1. Build Stratos in your usual way, for instance `npm run build`.
    - It could be that this fails due to TypeScript import issues, if so go through these and fix.
    - During build time the custom packages will be discovered and output, see section starting `Building with these extensions`. These should contain the modules your require.
1. Run Stratos your usual way. Ensure you can navigate to all your custom parts.
1. Once you are happy everything works as intended remove the old `./custom-src` directory and commit you changes.

## Further Guidance
Our ACME demo (`src/frontend/packages/example-extensions` and `src/frontend/packages/example-theme`) and SUSE repo ([theme](https://github.com/SUSE/stratos/tree/master/src/frontend/packages/suse-theme) and [extensions](https://github.com/SUSE/stratos/tree/master/src/frontend/packages/suse-extensions)) have both been updated and are fully compatible with the 4.0 changes. Both are a good source for examples.

If there any questions or issues please reach out to us either on out Github [repo](https://github.com/cloudfoundry/stratos) or Slack room [#stratos](https://cloudfoundry.slack.com/?redir=%2Fmessages%2Fstratos).