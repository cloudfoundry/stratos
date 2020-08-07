---
title: Migrating to V4
sidebar_label:  Migrating to V4
---

In version 4 of Stratos there are breaking customization changes from previous versions.

These changes allow a much improved approach to extensions by opening the door to npm style plugins.

To aid in migrating we've provided these instructions.

1. Before updating to the latest code...
    - Run `npm run customize-reset` to remove all previously created sym links.
    - Read through the customization documentation below to get a better understanding of the new process.
1. Update your codebase with the desired v4 code.
1. Run `npm install` (only required first time, this will ensure you have the required version of Angular).
1. Change directory to `./build/tools/v4-migration` and run the migration script `./migrate.sh`.
    - This will copy your customizations from `custom-src` to a new Angular package `src/frontend/packages/custom_extensions`.
1. Check that the new package exports your custom module and if applicable your custom-routing module.
    - The migrate script should do this in `src/frontend/packages/custom_extensions/src/public-api.ts`.
1. Check that your ts config file defines the public api file.
    - `src/tsconfig.json` file's `compilerOptions/paths` section should contain something like `"@custom/extensions": ["frontend/packages/custom_extensions/src/public-api.ts"]`.
1. Check that your new package's package.json defines your custom module and if application custom-routing module.
    - See `src/frontend/packages/suse_extensions/package.json` file's `stratos` section.
    - Note your `routingModule` entry label should not have a preceding `_`.
1. Build Stratos in your usual way, for instance `npm run build`.
    - It could be that this fails due to TypeScript import issues, if so go through these and fix.
    - During build time the custom packages will be discovered and output, see section starting `Building with these extensions`. These should contain the modules your require.
1. Run Stratos your usual way. Ensure you can navigate to all your custom parts.
1. Once you are happy everything works as intended remove the old `./custom-src` directory and commit you changes.
