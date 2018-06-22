# Change Log

## 2.0.0 Beta 2
[Full Changelog](https://github.com/cloudfoundry-incubator/stratos/compare/v2.0.0-beta-001...2.0.0-beta-002)

This is the second Beta release of Version 2 of Stratos. This is a major release.

The main focus of this release are bug fixes and hardening for a first release candidate.

**Improvements:**

- SSO Login Support [\#2491](https://github.com/cloudfoundry-incubator/stratos/pull/2491),  [\#2495](https://github.com/cloudfoundry-incubator/stratos/pull/2495)
- Add No Javascript message [\#2444](https://github.com/cloudfoundry-incubator/stratos/issues/2444)
- Show users without usernames [\#2496](https://github.com/cloudfoundry-incubator/stratos/pull/2496)
- Support OAuth login to console - V2 [\#2479](https://github.com/cloudfoundry-incubator/stratos/pull/2479)
- Add support for longer timeout for mutating operations \(POST etc\) [\#2401](https://github.com/cloudfoundry-incubator/stratos/pull/2401)
- Add Cookie Domain support [\#2432](https://github.com/cloudfoundry-incubator/stratos/pull/2432)
- Minor UI improvements [\#2384](https://github.com/cloudfoundry-incubator/stratos/pull/2384), [\#2383](https://github.com/cloudfoundry-incubator/stratos/pull/2383), [\#2378](https://github.com/cloudfoundry-incubator/stratos/pull/2378), [\#2499](https://github.com/cloudfoundry-incubator/stratos/pull/2499), [\#2482](https://github.com/cloudfoundry-incubator/stratos/pull/2482), [\#2481](https://github.com/cloudfoundry-incubator/stratos/pull/2481), [\#2394](https://github.com/cloudfoundry-incubator/stratos/pull/2394),  [\#2457](https://github.com/cloudfoundry-incubator/stratos/issues/2457), [\#2447](https://github.com/cloudfoundry-incubator/stratos/issues/2447)

**Fixes:**

- Error logged in console when reloading to app routes page [\#2493](https://github.com/cloudfoundry-incubator/stratos/issues/2493)
- Deal with non CF Jetstream failed requests [\#2497](https://github.com/cloudfoundry-incubator/stratos/pull/2497)
- Error after disconnecting an endpoint [\#2460](https://github.com/cloudfoundry-incubator/stratos/issues/2460)
- All endpoints are incorrectly shown to be in error state [\#2459](https://github.com/cloudfoundry-incubator/stratos/issues/2459)
- When one CF fails, we don't show data for those that succeed. [\#2456](https://github.com/cloudfoundry-incubator/stratos/issues/2456)
- Exception on create space stepper when you cancel out [\#2454](https://github.com/cloudfoundry-incubator/stratos/issues/2454)
- Error when creating a Space with a space character in the name [\#2451](https://github.com/cloudfoundry-incubator/stratos/issues/2451)
- Fix backend error logging [\#2484](https://github.com/cloudfoundry-incubator/stratos/pull/2484), [\#2407](https://github.com/cloudfoundry-incubator/stratos/pull/2407), [\#2413](https://github.com/cloudfoundry-incubator/stratos/pull/2413)
- Fix for panic when res is not set in error logging [\#2441](https://github.com/cloudfoundry-incubator/stratos/pull/2441)
- Firefox rendering - focus border on drop-down menu items [\#2446](https://github.com/cloudfoundry-incubator/stratos/issues/2446)
- Users Permissions: Removing the last role \(Org User\) results in an exception [\#2438](https://github.com/cloudfoundry-incubator/stratos/issues/2438)
- Users Permissions: Assigning a role to a user that has none results in an exception [\#2428](https://github.com/cloudfoundry-incubator/stratos/issues/2428)
- Exception thrown when adding space to empty org [\#2418](https://github.com/cloudfoundry-incubator/stratos/issues/2418)
- Warn if cookie domain does not match Stratos URL [\#2414](https://github.com/cloudfoundry-incubator/stratos/issues/2414)
- Add commit SHA to version when built for Kubernetes/Docker Compose [\#2410](https://github.com/cloudfoundry-incubator/stratos/issues/2410)
- Ensure we only raise internal errors on fetch api requests [\#2494](https://github.com/cloudfoundry-incubator/stratos/pull/2494)
- Fix failure to update commit info on redeploy [\#2492](https://github.com/cloudfoundry-incubator/stratos/pull/2492)
- Fix issue timing issue resulting in  invalid Space Service request [\#2489](https://github.com/cloudfoundry-incubator/stratos/pull/2489)
- Improved fix for exception on org screen after fresh load on create space [\#2487](https://github.com/cloudfoundry-incubator/stratos/pull/2487)
- Fix layout on summary pages [\#2482](https://github.com/cloudfoundry-incubator/stratos/pull/2482)
- Fix error shown when cancelling out of a freshly loaded create space stepper [\#2478](https://github.com/cloudfoundry-incubator/stratos/pull/2478)
- Users tables: Only show org/space name in pills when needed [\#2443](https://github.com/cloudfoundry-incubator/stratos/pull/2443)
- Fix issue where space count is wrong after deleting a space [\#2439](https://github.com/cloudfoundry-incubator/stratos/pull/2439)
- Update the connected user roles section of store on roles change [\#2435](https://github.com/cloudfoundry-incubator/stratos/pull/2435)
- Fix list state \(deleting/etc\) [\#2434](https://github.com/cloudfoundry-incubator/stratos/pull/2434)
- Fix exception when a space is added to an empty org [\#2433](https://github.com/cloudfoundry-incubator/stratos/pull/2433)
- Fix exception thrown when only assign an org user role [\#2430](https://github.com/cloudfoundry-incubator/stratos/pull/2430)
- Fix pagination of space level routes and service instance tables [\#2429](https://github.com/cloudfoundry-incubator/stratos/pull/2429)
- Disable removal of `org user` role if user has others [\#2427](https://github.com/cloudfoundry-incubator/stratos/pull/2427)
- Show an overlay and deleting message when deleting from a card or table action. [\#2415](https://github.com/cloudfoundry-incubator/stratos/pull/2415)
- Fix errors when multiple cf's are connected as both admin and non-admin users [\#2409](https://github.com/cloudfoundry-incubator/stratos/pull/2409)
- Fix not detecting admin user is admin scope is not stratos.admin [\#2403](https://github.com/cloudfoundry-incubator/stratos/pull/2403)
- Table loading init [\#2412](https://github.com/cloudfoundry-incubator/stratos/pull/2412)
- Users Table: Restrict org/space roles and prefix space name with org... depending on depth [\#2402](https://github.com/cloudfoundry-incubator/stratos/pull/2402)
- CfOrgSpace Selector: Fix overzealous `no orgs` error message [\#2397](https://github.com/cloudfoundry-incubator/stratos/pull/2397)
- Org space list - Deleting causes exceptions in other parts of the org page. [\#2393](https://github.com/cloudfoundry-incubator/stratos/pull/2393)
- Fix infinite user list's loading indicator when connected as user with no roles [\#2390](https://github.com/cloudfoundry-incubator/stratos/pull/2390)
- Fix TCP route creation and improve UI [\#2388](https://github.com/cloudfoundry-incubator/stratos/pull/2388)
- Add global deleting overlay for entity summary pages [\#2373](https://github.com/cloudfoundry-incubator/stratos/pull/2373)
- Fix various application deploy bugs [\#2372](https://github.com/cloudfoundry-incubator/stratos/pull/2372)


# 2.0.0 Beta 1

[Full Changelog](https://github.com/SUSE/stratos-ui/compare/1.0.2...v2.0.0-beta-001)

This is the first Beta release of Version 2 of Stratos. This is a major release.

The main focus of this release is a new version of the front-end UI in Angular (Version 1 used AngularJS). The UI has undergone numerous updates and we have switched out our own UI component set in favour of Material Design.

Highlights of version 2:

- Adoption of Angular in place of AngularJS
- User of the Angular Material component library and an adoption of Material Design
- Largely feature complete with version 1 (see below)
- Improved Services support with Services and Marketplace now shown at the top-level of the UI
- Improved UI throughout with card layouts used to improve readability
- Added ability to re-deploy applications from GitHub
- Improved Application UI - Instances and Routes information is now shown on separate tabs and the instances view has been improved

The following features in version 1 are not currently available in version 2:

- i18n - V2 supports US English only. This will be addressed as soon as the Angular platform supports string translation outside of templates.
- Extensions/Plugins - The ability to extend the UI at various points will be added in the next minor version.
- Drag and Drop for Application Deployment - You can not drag and drop a file/folder or url onto the application deployment UI - you have to use the browse UI.

# 1.1.0 Release

[Full Changelog](https://github.com/SUSE/stratos-ui/compare/1.0.2...1.1.0)

**Improvements:**

- Added support for SUSE Cloud Foundry 1.1 configuration values to the Helm chart [\#1950](https://github.com/cloudfoundry-incubator/stratos/pull/1950)

**Fixes:**

- Fix width of top nav bar menu's bottom border [\#1739](https://github.com/cloudfoundry-incubator/stratos/pull/1739)

## 1.0.2 Release

[Full Changelog](https://github.com/SUSE/stratos-ui/compare/1.0.0...1.0.2)

**Improvements:**

- Added Confirmation prompts for stopping and restarting apps [\#1437](https://github.com/SUSE/stratos-ui/pull/1437)

**Fixes:**

- Memory and disk usage should respect the number of app instances [\#1625](https://github.com/SUSE/stratos-ui/pull/1625)
- Fix issue around apps and routes missing from space entity [\#1447](https://github.com/SUSE/stratos-ui/pull/1447)
- Fix minor localisation issue [\#1596](https://github.com/cloudfoundry-incubator/stratos/pull/1596)

## 1.0.0 Release

[Full Changelog](https://github.com/SUSE/stratos-ui/compare/0.9.9...1.0.0)

**Improvements:**
- Added French localization (*Open Source build only*) [\#1419](https://github.com/SUSE/stratos-ui/pull/1419)

**Fixes:**
- Removed dependency `jsdocs` because of security vulnerability [\#1428](https://github.com/SUSE/stratos-ui/pull/1428)
- Fix vertical alignment for setup screens (*Open Source build only*) [\#1417](https://github.com/SUSE/stratos-ui/pull/1417)

## 0.9.9 Release Candidate 1 Release

[Full Changelog](https://github.com/SUSE/stratos-ui/compare/0.9.8...0.9.9)

This is the first Release Candidate of the Stratos UI Console. It contains the following improvements:

**Improvements:**

- Open Source build now uses a generic theme [\#1403](https://github.com/SUSE/stratos-ui/pull/1403)
- SUSE build uses SUSE theme and contains EULA in the about screen [\#1404](https://github.com/SUSE/stratos-ui/pull/1404)
- Run Mariadb mysqld process as mysql user [\#1397](https://github.com/SUSE/stratos-ui/pull/1397)
- Helm Chart: Persistent Volume size increased from 1Mi to 20Mi to avoid issues with some storage providers [\#1409](https://github.com/SUSE/stratos-ui/pull/1409)

## 0.9.8 Beta-3 Release 2

[Full Changelog](https://github.com/SUSE/stratos-ui/compare/0.9.7...0.9.8)

This is an update of the third beta release of the Stratos UI Console. It contains the following bug fixes and improvements:

**Improvements:**

- Improve display of byte usage information for small numbers [\#1388](https://github.com/SUSE/stratos-ui/pull/1388)
- Remove the yellow autocomplete background in dark form fields [\#1372](https://github.com/SUSE/stratos-ui/pull/1372)
- Helm Chart: Create Image pull secret for secure repositories [\#1387](https://github.com/SUSE/stratos-ui/pull/1387)
- Helm Chart: Remove `shared` mode [\#1385](https://github.com/SUSE/stratos-ui/pull/1385)

**Fixes:**

- Fix link shown on cf dashboard when no endpoints connected [\#1369](https://github.com/SUSE/stratos-ui/pull/1369)
- Fix leak of Persistent volume claims when deleting Helm deployed release [\#1368](https://github.com/SUSE/stratos-ui/pull/1368)
- Remove legacy images and associated files [\#1390](https://github.com/SUSE/stratos-ui/pull/1390)
- Fix unsafe casting for mysql Service [\#1381](https://github.com/SUSE/stratos-ui/pull/1381)

## 0.9.7 Beta-3 Release

[Full Changelog](https://github.com/SUSE/stratos-ui/compare/0.9.6...0.9.7)

This is the third beta release of the Stratos UI Console. It contains the following bug fixes:

**Fixes:**
- Updated Helm Chart to remove delete job when running in noShared mode [\#1364](https://github.com/SUSE/stratos-ui/pull/1364)
- Updated Helm Chart to support common storage class for MariaDB and console [\#1363](https://github.com/SUSE/stratos-ui/pull/1363)
- Updated Helm Chart to remove `postgres-client` from postflight job [\#1358](https://github.com/SUSE/stratos-ui/pull/1358)
- Updated Helm Chart to remove noShared backend container image [\#1357](https://github.com/SUSE/stratos-ui/pull/1357)

## 0.9.6 Beta-2 Release

[Full Changelog](https://github.com/SUSE/stratos-ui/compare/0.9.5...0.9.6)

This is the second beta release of the Stratos UI Console. It contains the following bug fixes and improvements:

**Improvements:**

- Add ability to edit a service instance [\#1324](https://github.com/SUSE/stratos-ui/pull/1324)
- Improve URL validation on setup flow [\#1320](https://github.com/SUSE/stratos-ui/pull/1320)
- Make search boxes not usable and visually show this while fetching orgs and spaces [\#1287](https://github.com/SUSE/stratos-ui/pull/1287)
- Make sure the expiry date time is relative to the time as the client sees it [\#1299](https://github.com/SUSE/stratos-ui/pull/1299)
- Add loading indicators to endpoints and Cloud Foundry dashboards [\#1325](https://github.com/SUSE/stratos-ui/pull/1325)
- Improve the loading indicators on initial console load [\#1286](https://github.com/SUSE/stratos-ui/pull/1286)
- Move deploy status and title into the log viewer title bar. [\#1277](https://github.com/SUSE/stratos-ui/pull/1277)
- Upgrade to Angular 1.6 [\#1307](https://github.com/SUSE/stratos-ui/pull/1307)
- Enable binding of mysql db service to CF hosted console [\#1260](https://github.com/SUSE/stratos-ui/pull/1260)
- Add support for a backend healthcheck [\#1321](https://github.com/SUSE/stratos-ui/pull/1321)
- Allow helm scf-values to be used to deploy the console [\#1344](https://github.com/SUSE/stratos-ui/pull/1344)
- Add ability to configure UAA settings when deploying UI through helm chart [\#1315](https://github.com/SUSE/stratos-ui/pull/1315)
- Use custom buildpack to build Stratos UI [\#1283](https://github.com/SUSE/stratos-ui/pull/1283)
- Migrate container images to opensuse:42.3 base [\#1293](https://github.com/SUSE/stratos-ui/pull/1293)
- Replace goose with custom database migrator [\#1334](https://github.com/SUSE/stratos-ui/pull/1334)

**Fixes:**

- Fix for app wall cf/org/space context not carrying over to deploy-location selector [\#1273](https://github.com/SUSE/stratos-ui/pull/1273)
- Add a logout button when only the error page is shown [\#1289](https://github.com/SUSE/stratos-ui/pull/1289)
- Address minor bugs in the deploy application for github [\#1285](https://github.com/SUSE/stratos-ui/pull/1285)
- Fix incorrect service summary info shown [\#1306](https://github.com/SUSE/stratos-ui/pull/1306)
- Fix i10n for empty/no app events [\#1303](https://github.com/SUSE/stratos-ui/pull/1303)
- Staging fails when pushed from Windows [\#1322](https://github.com/SUSE/stratos-ui/issues/1322)
- Properly kill upgrade echo instance [\#1311](https://github.com/SUSE/stratos-ui/pull/1311)
- Helm chart: Switch to `noShared` mode by default to support more setups [\#1295](https://github.com/SUSE/stratos-ui/pull/1295)
- Kubernetes/GCE: Skip HTTP endpoint when a load balancer is being setup [\#1305](https://github.com/SUSE/stratos-ui/pull/1305)
- Fix typo in error message of sshHostKeyChecker [\#1294](https://github.com/SUSE/stratos-ui/pull/1294)
- Fix line endings [\#1332](https://github.com/SUSE/stratos-ui/pull/1332)


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
