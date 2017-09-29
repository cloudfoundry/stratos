# Change Log

## 0.9.5 Beta-1 Release

[Full Changelog](https://github.com/SUSE/stratos-ui/compare/0.9.2...0.9.5)

This is the first beta release of the Stratos UI Console. It contains the following bug fixes and improvements:

**Improvements:**

- Added support for parameters when creating/binding services [\#1253](https://github.com/SUSE/stratos-ui/pull/1253)
- Added support for tags when creating service instances [\#1252](https://github.com/SUSE/stratos-ui/pull/1252)
- Moved service instances to a new Application tab [\#1237](https://github.com/SUSE/stratos-ui/pull/1237)
- Show deployment information in Application summary for console deployed apps [\#1243](https://github.com/SUSE/stratos-ui/pull/1243)
- Minor UI tweaks following UX review [\#1249](https://github.com/SUSE/stratos-ui/pull/1249)
- Pre-sort service instances in cloud foundry space instances table [\#1233](https://github.com/SUSE/stratos-ui/pull/1233)
- Enable binding of postgres CF db service to CF hosted console [\#1231](https://github.com/SUSE/stratos-ui/pull/1231)
- Migrate Helm chart to use MariaDB instead of Postgres [\#1230](https://github.com/SUSE/stratos-ui/pull/1230)
- Added initial BOSH Release [\#1222](https://github.com/SUSE/stratos-ui/pull/1222)
- Improve SSL certificate handling when deploying through Helm [\#1210](https://github.com/SUSE/stratos-ui/pull/1210)
- Added ability to deploy application from a git url [\#1208](https://github.com/SUSE/stratos-ui/pull/1208)

**Fixes:**

- Fixed a couple of minor translation issues [\#1247](https://github.com/SUSE/stratos-ui/pull/1247)
- Fix for broken cf push [\#1244](https://github.com/SUSE/stratos-ui/pull/1244)
- Fix for translation issue on the landing page language options [\#1234](https://github.com/SUSE/stratos-ui/pull/1234)
- Fixed filtering by text/endpoint bug [\#1268](https://github.com/SUSE/stratos-ui/pull/1268)
- Fix for missing icon for the busy state [\#1267](https://github.com/SUSE/stratos-ui/pull/1267)
- Fixed incorrect caching and reset behaviour of app wall filters [\#1248](https://github.com/SUSE/stratos-ui/pull/1248)
- Fixed create app issues related to route visibility/permissions [\#1246](https://github.com/SUSE/stratos-ui/pull/1246)

## 0.9.2 Alpha-3 Release
[Full Changelog](https://github.com/SUSE/stratos-ui/compare/0.9.1...0.9.2)

Third alpha release containing the following bug fixes and minor improvements:

- Fix a few service instance bugs [\#1226](https://github.com/SUSE/stratos-ui/pull/1226)
- Fixes issues where trailing slash in CF endpoint causes problems [\#1224](https://github.com/SUSE/stratos-ui/pull/1224)
- Reuse unbound routes [\#1223](https://github.com/SUSE/stratos-ui/pull/1223)
- Optionally enable endpoints-dashboard via env var for use in cf push [\#1221](https://github.com/SUSE/stratos-ui/pull/1221)
- Use stable name for docker registry in CI pipelines [\#1220](https://github.com/SUSE/stratos-ui/pull/1220)
- Improve documentation [\#1219](https://github.com/SUSE/stratos-ui/pull/1219)
- Add upgrade documentation for helm repository based installation [\#1218](https://github.com/SUSE/stratos-ui/pull/1218)
- Update CI piplines for environment [\#1217](https://github.com/SUSE/stratos-ui/pull/1217)
- Fixed docker image name for all-in-one deployment [\#1216](https://github.com/SUSE/stratos-ui/pull/1216)
- Persist app wall selection of cf/org/space in local storage [\#1214](https://github.com/SUSE/stratos-ui/pull/1214)
- Fix 'remove' i10n in create space modal [\#1213](https://github.com/SUSE/stratos-ui/pull/1213)
- Fix terminate instance UI [\#1211](https://github.com/SUSE/stratos-ui/pull/1211)
- Fix issue where previously selected language was not shown on landing page [\#1209](https://github.com/SUSE/stratos-ui/pull/1209)
- Add missing defaults to values.yaml [\#1207](https://github.com/SUSE/stratos-ui/pull/1207)
- Fix localisation in unmap route from apps modal \(unmap route from app is fine\) [\#1206](https://github.com/SUSE/stratos-ui/pull/1206)
- Split deploy app wizard service into smaller chunks [\#1202](https://github.com/SUSE/stratos-ui/pull/1202)
- UX Review: Update landing page \(login + setup screens\) [\#1200](https://github.com/SUSE/stratos-ui/pull/1200)
- Remember grid or list state for the app wall [\#1199](https://github.com/SUSE/stratos-ui/pull/1199)

## 0.9.1 Alpha-2 Release
[Full Changelog](https://github.com/SUSE/stratos-ui/compare/0.9.0...0.9.1)

Second alpha release contains the following fixes:

- Improved documentation when deploying using Helm  [\#1201](https://github.com/SUSE/stratos-ui/pull/1201)
- Added the ability to deploy the Console helm chart without using shared volumes, to make it easier to deploy in multi-node clusters with basic storage provisioner such as `hostpath` [\#1204](https://github.com/SUSE/stratos-ui/pull/1204)
- Specified the `cflinuxfs2` stack to the CF manifest.yaml, since default CAASP stack `opensuse42` is unable to deploy the app  [\#1205](https://github.com/SUSE/stratos-ui/pull/1205)
- Changed root of the volume mount for Postgres in kubernetes to address permission issue in certain environments  [\#1203](https://github.com/SUSE/stratos-ui/pull/1203)

## 0.9.0 Alpha-1 Release

First Alpha release of the Stratos UI Console.

For information on the Alpha feature set and on deploying the Console, please start with the main [README](https://github.com/SUSE/stratos-ui/blob/0.9.0/README.md) documentation.
