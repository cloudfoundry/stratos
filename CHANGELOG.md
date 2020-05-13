# Change Log

## 3.2.0

[Full Changelog](https://github.com/cloudfoundry/stratos/compare/3.1.0...3.2.0)

This release contains a number of fixes and improvements:

**Improvements:**

- SSO_WHITELIST should be able to ignore path [\#4273](https://github.com/cloudfoundry/stratos/issues/4273)
- Improve view that shows details for a metrics endpoint [\#4271](https://github.com/cloudfoundry/stratos/issues/4271)
- Helm Chart: Add support for node selectors [\#4265](https://github.com/cloudfoundry/stratos/issues/4265)
- Add documentation for list's 'max' feature, include info on 'fetch all' button [\#4259](https://github.com/cloudfoundry/stratos/issues/4259)
- Backup Endpoints & Tokens [\#4228](https://github.com/cloudfoundry/stratos/issues/4228)

**Fixes:**

- User profile is fetched on most page changes [\#4284](https://github.com/cloudfoundry/stratos/issues/4284)
- Service Marketplace: Create service icon is incorrectly aligned [\#4280](https://github.com/cloudfoundry/stratos/issues/4280)
- Deployment time does not show correctly in diagnostics when deployed with Helm 3 [\#4261](https://github.com/cloudfoundry/stratos/issues/4261)
- Pushing app from Stratos can sometimes fail due to expired token [\#4253](https://github.com/cloudfoundry/stratos/issues/4253)
- Helm: Chart fails to render if `uaa` section is missing, docs misleading [\#4248](https://github.com/cloudfoundry/stratos/issues/4248)
- Profile: Disabling polling fails to disable polling [\#4244](https://github.com/cloudfoundry/stratos/issues/4244)
- App Summary: Github tab: Row highlight of deployed commit is obscured [\#4243](https://github.com/cloudfoundry/stratos/issues/4243)
- Data Inaccuracies in PCF [\#4237](https://github.com/cloudfoundry/stratos/issues/4237)

## 3.1.0

[Full Changelog](https://github.com/SUSE/stratos/compare/3.0.0...3.1.0)

This release contains a number of fixes and improvements:

**Improvements:**

- Add containers table in pods list pod row drop down [\#351](https://github.com/SUSE/stratos/pull/351)
- Update Feature Flags with new entries [\#4188](https://github.com/cloudfoundry/stratos/issues/4188)
- Improve Application Deployment UI [\#4183](https://github.com/cloudfoundry/stratos/pull/4183)
- Scalability: Improve handling of 'maxed' lists [\#4180](https://github.com/cloudfoundry/stratos/issues/4180)
- Scalability: Add button to load maxed lists [\#4179](https://github.com/cloudfoundry/stratos/issues/4179)
- Scalability: Improve scaling of service instances [\#4162](https://github.com/cloudfoundry/stratos/pull/4162)
- Scalability: Improve scaling of users and organisations [\#4156](https://github.com/cloudfoundry/stratos/pull/4156)
- Local Admin User: Auto-login user if they have just set up account [\#4135](https://github.com/cloudfoundry/stratos/issues/4135)
- Add support for showing Gravatar for the user icon [\#4134](https://github.com/cloudfoundry/stratos/pull/4134)
- Disable Jetstream API logging via Env Var [\#4130](https://github.com/cloudfoundry/stratos/issues/4130)
- Improve UI element sizing and presentation on desktop [\#4129](https://github.com/cloudfoundry/stratos/pull/4129)
- Allow org managers to add users outside of org [\#4103](https://github.com/cloudfoundry/stratos/issues/4103)
- Allow Endpoint Name to be edited [\#3640](https://github.com/cloudfoundry/stratos/issues/3640)

**Fixes:**

- Metrics do not show for a Kubernetes 1.16+ cluster [\#362](https://github.com/SUSE/stratos/issues/362)
- Logos squashed in Workloads view [\#361](https://github.com/SUSE/stratos/issues/361)
- Can't deploy version 3.0.0 on EKS [\#357](https://github.com/SUSE/stratos/issues/357)
- CF Quota's `Maximum Application Instance Memory Usage` not formatted correctly [\#4206](https://github.com/cloudfoundry/stratos/issues/4206)
- Notification and error pages loop when using 'X' [\#4202](https://github.com/cloudfoundry/stratos/issues/4202)
- Cf app redeploy stepper starts with empty step, cannot continue [\#4185](https://github.com/cloudfoundry/stratos/issues/4185)
- Can't push apps with multiple buildpacks [\#4181](https://github.com/cloudfoundry/stratos/issues/4181)
- Deleting a Service Instance or User Provided Service Instance breaks list [\#4157](https://github.com/cloudfoundry/stratos/issues/4157)
- Deleting an organisation with spaces fails [\#4155](https://github.com/cloudfoundry/stratos/issues/4155)
- App Deploy should accept manifest .YML or .YAML [\#4152](https://github.com/cloudfoundry/stratos/issues/4152)
- Only fetch first page of maxed lists [\#4138](https://github.com/cloudfoundry/stratos/pull/4138)
- 'Register an endpoint' arrow misaligned [\#3519](https://github.com/cloudfoundry/stratos/issues/3519)

## 3.0.0

[Full Changelog](https://github.com/SUSE/stratos/compare/2.7.0...3.0.0)

This release sees the Helm functionality move out of technology preview and get an upgrade to Helm 3. Helm releases have been brought out to the
top-level under a new 'Workloads' side navigation item.

The Helm Chart has also been updated - the upgrade volume has been removed, custom annotations can be added to pods and other resources
and an external database can be used in place of the integrated MariaDB.

Release details:

**Fixes:**

- Error setting user favourites [\#4086](https://github.com/cloudfoundry/stratos/issues/4086)
- Fix local admin profile [\#4122](https://github.com/cloudfoundry/stratos/pull/4122)
- Multiple User Provided Service Instance Create/Update Fixes [\#4117](https://github.com/cloudfoundry/stratos/pull/4117)
- Fix user profile when deployed with Ingress (Helm) [\#4110](https://github.com/cloudfoundry/stratos/pull/4110)
- Fix panic on backend error logging [\#4098](https://github.com/cloudfoundry/stratos/pull/4098)
- Fix failing VCAP_SERVICE credentials check [\#4084](https://github.com/cloudfoundry/stratos/pull/4084)
- Edit application: fixed validation for mem and disk quota [\#4070](https://github.com/cloudfoundry/stratos/pull/4070)
- Fix local auth session timeout [\#4028](https://github.com/cloudfoundry/stratos/pull/4028)
- Ensure active dialog times out correctly [\#4026](https://github.com/cloudfoundry/stratos/pull/4026)
- Helm: Postflight job should not be a container [\#3506](https://github.com/cloudfoundry/stratos/issues/3506)
- Card for favourited helm endpoint shows `disconnected` [\#223](https://github.com/SUSE/stratos/issues/223)
- Hide required markers on login page [\#329](https://github.com/SUSE/stratos/pull/329)
- Fix registration and connection issues when some Kubernetes favlours [\#344](https://github.com/SUSE/stratos/pull/344)

**Improvements:**

- Deploy application via docker image [\#4025](https://github.com/cloudfoundry/stratos/issues/4025)
- Favourite Card: Add icon for endpoints and improve UX [\#4095](https://github.com/cloudfoundry/stratos/pull/4095)
- Add cf events page to cf, org and space levels [\#4066](https://github.com/cloudfoundry/stratos/pull/4066)
- Add table view to marketplace service table [\#4064](https://github.com/cloudfoundry/stratos/pull/4064)
- Add actions to app service table, add delete org button to org summary [\#4063](https://github.com/cloudfoundry/stratos/pull/4063)
- Improvements to error/notification process [\#4053](https://github.com/cloudfoundry/stratos/pull/4053)
- Add an initial loading indicator with customization support [\#4045](https://github.com/cloudfoundry/stratos/pull/4045)
- Add support for Stratos buildpack verbose logging [\#4039](https://github.com/cloudfoundry/stratos/pull/4039)
- Add support for setup UI for local admin account [\#4031](https://github.com/cloudfoundry/stratos/pull/4031)
- Add a dark mode [\#4017](https://github.com/cloudfoundry/stratos/pull/4017)
- Allow notifications to be marked as 'read' [\#4011](https://github.com/cloudfoundry/stratos/pull/4011)
- Add endpoint error page [\#3991](https://github.com/cloudfoundry/stratos/pull/3991)
- Helm Chart: Numerous improvements [\#4000](https://github.com/cloudfoundry/stratos/pull/4000)
- Helm Chart: Add support for using an external database [\#3499](https://github.com/cloudfoundry/stratos/issues/3499)
- Helm Chart: Randomize passwords [\#1416](https://github.com/cloudfoundry/stratos/issues/1416)
- Helm Chart: Allow custom annotations on Pods [\#4109](https://github.com/cloudfoundry/stratos/issues/4109)
- Helm Chart: Add support for default UAA zone [\#4101](https://github.com/cloudfoundry/stratos/issues/4101)
- Base images bump [\#3990](https://github.com/cloudfoundry/stratos/pull/3990)
- Update to Angular 8 [\#3950](https://github.com/cloudfoundry/stratos/pull/3950)
- Reflect app title in setup screens [\#4090](https://github.com/cloudfoundry/stratos/pull/4090)
- Add a confirmation dialogue when deleting a helm install [\#208](https://github.com/SUSE/stratos/issues/208)
- Add support for TLS with MySQL [\#325](https://github.com/SUSE/stratos/pull/325)
- Update SLE base images [\#316](https://github.com/SUSE/stratos/pull/316)
- Add loading indicator for Workload resource stats [\#313](https://github.com/SUSE/stratos/pull/313)
- Optionally create kube namespace during helm install [\#273](https://github.com/SUSE/stratos/pull/273)
- Switch to helm 3 [\#233](https://github.com/SUSE/stratos/pull/233)
- Add Workloads view [\#263](https://github.com/SUSE/stratos/pull/263)

## 2.7.0

[Full Changelog](https://github.com/SUSE/stratos/compare/2.6.1...2.7.0)

This release sees a change in branding to "SUSE Stratos Console" along with numerous fixes and improvements
to the Kubernetes Dashboard integration.

Details:

**Fixes:**

- Kubernetes Dashboard integration is hard to configure [\#270](https://github.com/SUSE/stratos/pull/270)
- Kubernetes Dashboard integration does not work with CaaSP 4.1 [\#269](https://github.com/SUSE/stratos/pull/269)
- Fix long running service actions [\#4049] (https://github.com/cloudfoundry/stratos/pull/4049)

**Improvements:**

- Update branding to "SUSE Stratos Console" [\#271](https://github.com/SUSE/stratos/pull/271)
- Show last operation and service broker info for service instances [\#4038](https://github.com/cloudfoundry/stratos/pull/4038)
- Disable Volume Migration Job [\#279](https://github.com/SUSE/stratos/issues/279)

## 2.6.1

[Full Changelog](https://github.com/cloudfoundry/stratos/compare/2.6.0...2.6.1)

This release contains a few fixes:

**Fixes:**

- Helm Chart does not work with Kubernetes 1.16 [\#4022](https://github.com/cloudfoundry/stratos/issues/4022)
- Generated Ingress certificates during Kubernetes deployment are empty [\#4006](https://github.com/cloudfoundry/stratos/issues/4006)
- Kubernetes Ingress certificate is incorrectly set [\#4005](https://github.com/cloudfoundry/stratos/issues/4005)
- Update metric used for cells [\#4009](https://github.com/cloudfoundry/stratos/pull/4009)
- Fix incorrect SSO behaviour following 2.4.0 --> 2.6.0 upgrade [\#4015](https://github.com/cloudfoundry/stratos/pull/4015)

## 2.6.0

[Full Changelog](https://github.com/SUSE/stratos/compare/2.5.3...2.6.0)

This release contains two fixes listed below.

> Note: The version number has been bumped to 2.6.0 to align with the upstream Stratos project.

**Fixes:**

- Fix alignment of user button on newer Firefox [\#3983](https://github.com/cloudfoundry-incubator/stratos/pull/3983)
- Fix self-signed certificate to support Mac OSX 10.15 [\#3982](https://github.com/cloudfoundry-incubator/stratos/pull/3982)

## 2.5.3

[Full Changelog](https://github.com/cloudfoundry-incubator/stratos/compare/2.5.2...2.5.3)

This release contains a number of fixes and improvements:

**Fixes:**

- Ensure we remove X-Forward-* HTTP headers that can cause problems proxying API requests [\#3934](https://github.com/cloudfoundry/stratos/pull/3934)
- Ensure MB is only shown for memory based quota values in edit quota forms [\#3892](https://github.com/cloudfoundry/stratos/pull/3892)
- Ensure stepper buttons are always visible and content scrolls [\#3890](https://github.com/cloudfoundry/stratos/pull/3890)
- Fix autoscaler issue related to editing a newly created policy[\#3886](https://github.com/cloudfoundry/stratos/pull/3886)
- Fix alignment of user button on newer Firefox [\#3983](https://github.com/cloudfoundry/stratos/pull/3983)
- Fix self-signed certificate to support Mac OSX 10.15 [\#3982](https://github.com/cloudfoundry/stratos/pull/3982)
- Add ingress support to Helm Chart [\#3935](https://github.com/cloudfoundry-incubator/stratos/pull/3935)
- Gate SSO redirect on optional state whitelist [\#3933](https://github.com/cloudfoundry-incubator/stratos/pull/3933)
- Backend update for cacheing compat for HTTP 1.0 clients [\#3931](https://github.com/cloudfoundry-incubator/stratos/pull/3931)

## 2.5.2

[Full Changelog](https://github.com/cloudfoundry-incubator/stratos/compare/2.5.1...2.5.2)

This release contains a number of fixes and improvements:

**Fixes:**

- Clicking on a metrics endpoint to view details freezes the UI [\#212](https://github.com/SUSE/stratos/pull/212)

**Improvements:**

- Add ingress support to Helm Chart [\#3935](https://github.com/cloudfoundry/stratos/pull/3935)
- Gate SSO redirect on optional state whitelist [\#3933](https://github.com/cloudfoundry/stratos/pull/3933)
- Backend update for cacheing compatibility for HTTP 1.0 clients [\#3931](https://github.com/cloudfoundry/stratos/pull/3931)
- Add support for local user account [\#3632](https://github.com/cloudfoundry/stratos/pull/3632)
- Add support for viewing and editing profile for local user account [\#3883](https://github.com/cloudfoundry/stratos/pull/3883)
- Better metrics endpoint comparison [\#206](https://github.com/SUSE/stratos/pull/206)
- Better Kubernetes endpoint comparison [\#209](https://github.com/SUSE/stratos/pull/209)

> Note: To enable the local user account, configure the password for the local user ('admin') when deploying via Helm by setting the Helm chart value `console.localAdminPassword` when installing. Once the user has been created, the user profile and password can be edited subsequently from the user profile view in the UI.

## 2.5.1

[Full Changelog](https://github.com/cloudfoundry-incubator/stratos/compare/2.5.0...2.5.1)

This release contains a number of fixes and improvements:

**Fixes:**

- Allow DB directory to be specified for SQLite [\#193](https://github.com/SUSE/stratos/pull/193)

**Improvements:**

- Tech preview for helm feature [\#190](https://github.com/SUSE/stratos/pull/190)
- Add custom welcome message on endpoints page [\#194](https://github.com/SUSE/stratos/pull/194)
- Add support for connecting CaaSP V4 endpoints [\#191](https://github.com/SUSE/stratos/pull/191)
- Refinements to the Autoscaler UI [\#196](https://github.com/SUSE/stratos/pull/196)
> Note: Tech preview features can be enabled when deploying via Helm by setting the Helm chart value `console.techPreview` to `true` - e.g. add `--set console.techPreview=true` when installing.

## 2.5.0

[Full Changelog](https://github.com/cloudfoundry/stratos/compare/2.4.0...2.5.0)

This release contains a number of fixes and improvements:

**Fixes:**

- Fix connect to IBM Cloud [\#3715](https://github.com/cloudfoundry/stratos/pull/3715)
- Create route - owned domains not proposed [\#3685](https://github.com/cloudfoundry/stratos/issues/3685)
- Fixed connect endpoint issues in Firefox [\#3679](https://github.com/cloudfoundry/stratos/pull/3679)
- Fixed connect endpoint rendering issue in Firefox [\#3678](https://github.com/cloudfoundry/stratos/pull/3678)
- Fix ExpressionChangedAfterItHasBeenCheckedError exception on home page [\#3667](https://github.com/cloudfoundry/stratos/pull/3667)
- Fix bosh prometheus metrics [\#3602](https://github.com/cloudfoundry/stratos/pull/3602)
- Fix stepper height on Chrome pre v72 & Bleeding of error style in stateful-icon [\#3599](https://github.com/cloudfoundry/stratos/pull/3599)
- Remove sidenav header underline [\#3556](https://github.com/cloudfoundry/stratos/issues/3556)
- cf/spaces routes: fixed breadcrumbs path for apps [\#3572](https://github.com/cloudfoundry/stratos/pull/3572)
- No space/org shown in cell app instances page [\#3536](https://github.com/cloudfoundry/stratos/issues/3536)
- Services Marketplace: cf endpoint on card when multiple cf connected [\#3560](https://github.com/cloudfoundry/stratos/pull/3560)
- Setup screens are missing header [\#3557](https://github.com/cloudfoundry/stratos/issues/3557)
- /uaa page is still available in a configured system [\#3056](https://github.com/cloudfoundry/stratos/issues/3056)
- Endpoint login exposes user credentials via query string [\#3160](https://github.com/cloudfoundry/stratos/issues/3160)
- Don't send registration info in query string [\#3777](https://github.com/cloudfoundry/stratos/pull/3777)

**Improvements:**

- Add Application Autoscaler UI [\#3455](https://github.com/cloudfoundry/stratos/pull/3455)
- Quotas: org/space quotas: listing and management [\#3650](https://github.com/cloudfoundry/stratos/pull/3650)
- Quotas: allow quota to be specified on creation/edit of org/space [\#3593](https://github.com/cloudfoundry/stratos/pull/3593)
- Refactor setup config [\#3694](https://github.com/cloudfoundry/stratos/pull/3694)
- Helm Chart: Add imagelist to the helm chart [\#3638](https://github.com/cloudfoundry/stratos/pull/3638)
- Support separate auth and token endpoints [\#3635](https://github.com/cloudfoundry/stratos/pull/3635)
- Improve failed connection message for cf & metrics endpoints [\#3600](https://github.com/cloudfoundry/stratos/pull/3600)
- Handle endpoint types that do no support connect [\#3596](https://github.com/cloudfoundry/stratos/pull/3596)
- Make disconnected endpoints more obviously different [\#3554](https://github.com/cloudfoundry/stratos/issues/3554)
- Always build with go modules [\#3589](https://github.com/cloudfoundry/stratos/pull/3589)
- Don't show cell metrics when they're not available [\#3586](https://github.com/cloudfoundry/stratos/pull/3586)
- Handle 'no auth' auth type in optional connect step [\#3535](https://github.com/cloudfoundry/stratos/issues/3535)
- Notifications page: Add a back button [\#3523](https://github.com/cloudfoundry/stratos/issues/3523)

## 2.4.0

[Full Changelog](https://github.com/cloudfoundry/stratos/compare/2.3.0...2.4.0)

This release contains a number of fixes and improvements:

**Fixes:**

- Fix issue where org level user lists shows space roles from other orgs [\#3399](https://github.com/cloudfoundry/stratos/pull/3399)
- Fix service broker action [\#3427](https://github.com/cloudfoundry/stratos/pull/3427)
- Service plan cost truncated in first service display [\#3431](https://github.com/cloudfoundry/stratos/issues/3431)
- Fix 'unknown locale' error message when viewing service plans [\#3447](https://github.com/cloudfoundry/stratos/pull/3447)
- Fix Gitlab deploy step [\#3469](https://github.com/cloudfoundry/stratos/pull/3469)
- Ensure Service Instance counts are correct [\#3448](https://github.com/cloudfoundry/stratos/pull/3448)
- Fix multiple app stats requests on org & space summary pages [\#3451](https://github.com/cloudfoundry/stratos/pull/3451)

**Improvements:**
- Change Side Navigation [\#3449](https://github.com/cloudfoundry/stratos/pull/3449)
- Use side nav instead of top tabs throughout [\#3289](https://github.com/cloudfoundry/stratos/pull/3289)
- Add support for inviting users to an org or space [\#3377](https://github.com/cloudfoundry/stratos/pull/3377) 
- Add support for User Favourites [\#3255](https://github.com/cloudfoundry/stratos/pull/3255)
- Add support for User Provided Service Instances [\#3415](https://github.com/cloudfoundry/stratos/pull/3415)
- Autocomplete git repository name [\#3372](https://github.com/cloudfoundry/stratos/pull/3372)
- Scale Users in CF Summary section [\#3371](https://github.com/cloudfoundry/stratos/pull/3371)
- Allow Stratos to be configured with via a User Provided Service [\#3405](https://github.com/cloudfoundry/stratos/pull/3405)
- Update front-end to Angular 7 [\#3418](https://github.com/cloudfoundry/stratos/pull/3418)
- Also show forked repositories when suggesting GitHub repositories in deploy app [\#3403](https://github.com/cloudfoundry/stratos/pull/3403)
- Hide User Favorites when using SQLite [\#3419](https://github.com/cloudfoundry/stratos/pull/3419)
- Hide Endpoints Page when using SQLite [\#3463](https://github.com/cloudfoundry/stratos/pull/3463)
- Add card view to endpoint list [\#3422](https://github.com/cloudfoundry/stratos/pull/3422)
- Add support for endpoint sub type \(and metadata\) [\#3423](https://github.com/cloudfoundry/stratos/pull/3423)
- Add tile selector to register endpoint stepper [\#3432](https://github.com/cloudfoundry/stratos/pull/3432)
- Add cf/org/space links to service instance table using common components [\#3436](https://github.com/cloudfoundry/stratos/pull/3436)
- Add a user provided service instance tab & list to the space page [\#3443](https://github.com/cloudfoundry/stratos/pull/3443)
- Ensure unknown endpoint types are handled correctly [\#3445](https://github.com/cloudfoundry/stratos/pull/3445)
- Add created and updated dates to organization/space summary [\#3460](https://github.com/cloudfoundry/stratos/pull/3460)
- Add support for slide-in side help and write in to endpoint connect dialog [\#3433](https://github.com/cloudfoundry/stratos/pull/3433)
- Improve no users message [\#3327](https://github.com/cloudfoundry/stratos/issues/3327)

## 2.3.0

[Full Changelog](https://github.com/cloudfoundry/stratos/compare/2.2.0...2.3.0)

### Important Security Fixes

This release fixes two CVEs identified in Stratos related to the Session Cookie - we recommend you update to 2.3.0.

* [CVE-2019-3783: Stratos Deploys With Public Default Session Store Secret](https://www.cloudfoundry.org/blog/cve-2019-3783)
* [CVE-2019-3784: Stratos contains a Session Collision Vulnerability](https://www.cloudfoundry.org/blog/cve-2019-3784/)

This release contains a number of fixes and improvements:

**Fixes:**
- Service instance names should be limited to 50 chars [\#3262](https://github.com/cloudfoundry/stratos/issues/3262)
- Metrics Charts: CPU usage tooltip should round value [\#3336](https://github.com/cloudfoundry/stratos/issues/3336)
- Allow apps in "offline while updating" state to be started[\#3332](https://github.com/cloudfoundry/stratos/issues/3332)
- Manage Users - space table filtering does not work “Search by space name” [\#3329](https://github.com/cloudfoundry/stratos/issues/3329)
- Make it clearer that you can manage roles for multiple users [\#3250](https://github.com/cloudfoundry/stratos/issues/3250)
- Register an endpoint arrow misaligned [\#3221](https://github.com/cloudfoundry/stratos/issues/3221)
- Fix exception when navigating away from the first deploy app step [\#3277](https://github.com/cloudfoundry/stratos/pull/3277)
- Ensure we don't try to get length of undefined endpoint description [\#3274](https://github.com/cloudfoundry/stratos/pull/3274)
- Fix null exception after creating a space in an new org [\#3351](https://github.com/cloudfoundry/stratos/pull/3351)
- Fixes double requests when single cf connected for lists with cf filter [\#3313](https://github.com/cloudfoundry/stratos/pull/3313)
- Fix auto select of single items in multi filter list [\#3306](https://github.com/cloudfoundry/stratos/pull/3306)
- Ensure an empty errorResponse gets picked up as a jetstream error [\#3301](https://github.com/cloudfoundry/stratos/pull/3301)
- Validate entity names locally [\#3296](https://github.com/cloudfoundry/stratos/pull/3296)
- Application Environment Variables fixes & improvements [\#3286](https://github.com/cloudfoundry/stratos/pull/3286)
- Hide app vars tab if user is not a space developer [\#3247](https://github.com/cloudfoundry/stratos/pull/3247)
- Limit card titles to two-lines with ellipsis/fade out [\#3241](https://github.com/cloudfoundry/stratos/pull/3241)
- Fix CLI info formatting [\#3237](https://github.com/cloudfoundry/stratos/pull/3237)
- Add Route: Use correct label for submit button [\#3231](https://github.com/cloudfoundry/stratos/pull/3231)
- Fix for cancel broken on add route [\#3228](https://github.com/cloudfoundry/stratos/pull/3228)
- Fix display of generic error bar [\#3214](https://github.com/cloudfoundry/stratos/pull/3214)
- Only show + icon when we have at least one connected CF [\#3211](https://github.com/cloudfoundry/stratos/pull/3211)
- Cannot deploy application from folder upload [\#3188](https://github.com/cloudfoundry/stratos/pull/3188)
- Fix issue where only first 100 services were shown in service marketplace [\#3161](https://github.com/cloudfoundry/stratos/pull/3161)
- Fix marketplace provisioning for asynchronous services [\#3086](https://github.com/cloudfoundry/stratos/pull/3086)
- Fix K8S Services not using correct label to select them [\#129](https://github.com/SUSE/stratos/pull/129)
- Fix issue with large files being sent into request URL [\#90](https://github.com/SUSE/stratos/pull/90)

**Improvements:**
- App Deploy: Add Public GitLab Repository support [\#3239](https://github.com/cloudfoundry/stratos/pull/3239)
- Add a routes list to the CF tabs, Routes Refactor & Route Bug Fixes [\#3292](https://github.com/cloudfoundry/stratos/pull/3292)
- Add deployment info for apps deployed via docker & fix info for local/archive apps [\#3291](https://github.com/cloudfoundry/stratos/pull/3291)
- Add service plan list to service pages [\#3275](https://github.com/cloudfoundry/stratos/pull/3275)
- Add Org and Space status bar to Org/Space Cards [\#3265](https://github.com/cloudfoundry/stratos/pull/3265)
- Add service provider name to marketplace service card [\#3268](https://github.com/cloudfoundry/stratos/pull/3268)
- Add link to dashboard in service instance table [\#3267](https://github.com/cloudfoundry/stratos/pull/3267)
- Add confirmation dialog to `Restage` app [\#3263](https://github.com/cloudfoundry/stratos/pull/3263)
- Add support for JSON Schemas when binding services to applications [\#3050](https://github.com/cloudfoundry/stratos/pull/3050)
- Scalability Improvements: Handle large number of apps in cf dashboards [\#3212](https://github.com/cloudfoundry/stratos/pull/3212)
- Support prometheus-boshrelease as a metrics endpoint [\#3202](https://github.com/cloudfoundry/stratos/pull/3202)
- Show better error message on login screen when account locked [\#3235](https://github.com/cloudfoundry/stratos/pull/3235)
- Helm Chart Service port configuration improvements  [\#3264](https://github.com/cloudfoundry/stratos/pull/3264)
- List Multifilter Improvements [\#3270](https://github.com/cloudfoundry/stratos/pull/3270)
- Stratos can now be deployed as a CF App using docker image [\#3294](https://github.com/cloudfoundry/stratos/pull/3294)
- Create stable docker image [\#3307](https://github.com/cloudfoundry/stratos/issues/3307)
- About Page Title customization support [\#3356](https://github.com/cloudfoundry/stratos/pull/3356)
- Make the table multi actions more obvious [\#3251](https://github.com/cloudfoundry/stratos/pull/3251)
- Use SHA256 to compare SSH public key fingerprint [\#3249](https://github.com/cloudfoundry/stratos/pull/3249)
- Show refresh button for latest modified application lists [\#3213](https://github.com/cloudfoundry/stratos/pull/3213)
- Improve focus & tabbing [\#3288](https://github.com/cloudfoundry/stratos/pull/3288)
- Tidy up CLI login info [\#3269](https://github.com/cloudfoundry/stratos/pull/3269)
- Reduce size of Docker All-in-one image [\#3261](https://github.com/cloudfoundry/stratos/pull/3261)
- Remove global manage apps link [\#3259](https://github.com/cloudfoundry/stratos/pull/3259)
- Add user has roles filter to users tables [\#3258](https://github.com/cloudfoundry/stratos/pull/3258)
- Deploy App: Add notification toast [\#3242](https://github.com/cloudfoundry/stratos/pull/3242)
- Update app instance cell data when scaling up [\#3133](https://github.com/cloudfoundry/stratos/pull/3133)
- Use product branding in place of Stratos [\#126](https://github.com/SUSE/stratos/pull/126)
- Show error on Kubernetes pages and Kubernetes endpoint page [\#96](https://github.com/SUSE/stratos/pull/96)
- Add validation when connecting Kubernetes endpoints [\#94](https://github.com/SUSE/stratos/pull/94)

## 2.2.0

[Full Changelog](https://github.com/cloudfoundry/stratos/compare/2.1.2...2.2.0)

This release contains a number of fixes and improvements. It introduces the first set of Extension points to allow
users to take Stratos and extend it with new functionality. Initial documentation is available [here](https://github.com/cloudfoundry/stratos/blob/master/docs/extensions.md). Additionally, when a metrics endpoint is connected, Cloud Foundry cell information is now shown in the Application Instances tab. A Cloud Foundry cells table and Cell summary pages have also been added to the Cloud Foundry section.

**Fixes:**

- Can't create an org then space [\#3093](https://github.com/cloudfoundry/stratos/issues/3093)
- Fix issue where app status showed old info after successful deploy [\#3115](https://github.com/cloudfoundry/stratos/pull/3115)
- Use our fork of go-flags to avoid dependency problems [\#3145](https://github.com/cloudfoundry/stratos/pull/3145)

**Improvements:**

- Extenstions: Add initial extensions support [\#2962](https://github.com/cloudfoundry/stratos/pull/2962)
- When deleting certain entities force user to input name of entity [\#3118](https://github.com/cloudfoundry/stratos/issues/3118)
- Usability: Deletion of an app should not allow deletion of "shared" routes and services [\#3034](https://github.com/cloudfoundry/stratos/issues/3034)
- User menu improvements [\#3136](https://github.com/cloudfoundry/stratos/pull/3136)
- Delete App Stepper: Disable delete of routes and services that are bound to other app/s [\#3129](https://github.com/cloudfoundry/stratos/pull/3129)
- Metrics Charts: If only one series in chart don't show legend [\#3124](https://github.com/cloudfoundry/stratos/issues/3124)
- Deploy Application: Ensure when leaving the stepper with a successfully deployed app the app state is correct [\#3021](https://github.com/cloudfoundry/stratos/issues/3021)
- Endpoints Table: For non-cf endpoints show `-` instead of `\(x\) no` [\#3123](https://github.com/cloudfoundry/stratos/issues/3123)
- Endpoints Table: Only show 'Admin' check icon for cf endpoints [\#3132](https://github.com/cloudfoundry/stratos/pull/3132)
- Ensure CF Cells info is shown for non cf admins [\#3121](https://github.com/cloudfoundry/stratos/pull/3121)
- Add helm chart labels  [\#3110](https://github.com/cloudfoundry/stratos/pull/3110)
- Cf Cell: Applications list [\#3107](https://github.com/cloudfoundry/stratos/pull/3107)
- Make instance termination more resilient [\#3103](https://github.com/cloudfoundry/stratos/pull/3103)
- Remove rogue self dependency [\#3100](https://github.com/cloudfoundry/stratos/pull/3100)
- Metrics: Add CF Cells view [\#3099](https://github.com/cloudfoundry/stratos/pull/3099)
- Ensure we handle orgs with no users correctly [\#3098](https://github.com/cloudfoundry/stratos/pull/3098)
- Metrics: Add Prometheus Job Information [\#3082](https://github.com/cloudfoundry/stratos/pull/3082)
- Metrics: Add support for query\_range [\#3081](https://github.com/cloudfoundry/stratos/pull/3081)
- Extensions: Add example of extension points [\#3048](https://github.com/cloudfoundry/stratos/pull/3048)

## 2.1.2

[Full Changelog](https://github.com/cloudfoundry/stratos/compare/2.1.1...2.1.2)

This release fixes an issue with a broken backend dependency, where the pinned version that was being used is no longer available.

- Fix go-flags dependency pinned version broken [\#3071](https://github.com/cloudfoundry/stratos/pull/3071)

## 2.1.1

[Full Changelog](https://github.com/cloudfoundry/stratos/compare/2.1.0...2.1.1)

This is a bug fix release that addresses the following issues:

**Fixes:**

- App wall filtering can stop working  with some filter combinations [\#3043](https://github.com/cloudfoundry/stratos/pull/3043)

- Can not connect a metrics endpoint [\#3035](https://github.com/cloudfoundry/stratos/issues/3035)

- Backend build issue due to the pinned commit for a dependency being removed [\#3060](https://github.com/cloudfoundry/stratos/pull/3060)


- Metrics: Wrong job can be matched up when there are multiple jobs [\#3057](https://github.com/cloudfoundry/stratos/pull/3057)

## 2.1.0

[Full Changelog](https://github.com/cloudfoundry/stratos/compare/2.0.1...2.1.0)

Release highlights:

- Stratos frontend can be pre-built before pushing to Cloud Foundry to enable AOT and reduce push time
- SSO support refinements with the ability to now connect a Cloud Foundry endpoint using SSO in addition to SSO login to Straos itself
- Ability to specify manifest overrides when deploying an application
- Ability to optionally specify Client ID and Client Secret when registering an endpoint
- Add ability to restage an application
- Endpoints list now shows logged in user's username and whether they're an admin
- Switched to new Stratos logo for login and about pages
- Backend improvements to make it easier for developers to develop with
- Security fixes

**Fixes:**

- Diagnostics can report incorrect migrations [\#2965](https://github.com/cloudfoundry/stratos/issues/2965)
- Backend should only gzip static responses [\#2925](https://github.com/cloudfoundry/stratos/issues/2925)
- Incorrect deployment type when deployed as a CF App [\#2858](https://github.com/cloudfoundry/stratos/issues/2858)
- Space Scoped Services are absent in the `Select Service` when the correct space/org is selected [\#2829](https://github.com/cloudfoundry/stratos/issues/2829)
- I can not get service information [\#2814](https://github.com/cloudfoundry/stratos/issues/2814)
- Fix security vulnerability CVE-2018-3774 introduced by nested dependency [\#2851](https://github.com/cloudfoundry/stratos/issues/2851)
- Fix issues with cookie not being marked as secure or http only with sqlite session store [\#2911](https://github.com/cloudfoundry/stratos/pull/2911)
- Update cache-control header [\#2910](https://github.com/cloudfoundry/stratos/pull/2910)
- Upgrade angular to 6.1.1 to fix security vulnerability [\#2850](https://github.com/cloudfoundry/stratos/pull/2850)
- Fixes and improvement for the diagnostics page [\#2860](https://github.com/cloudfoundry/stratos/pull/2860)
- Fix several manage user role bugs [\#2826](https://github.com/cloudfoundry/stratos/pull/2826)
- Diagnostics does not show GitHub details when cloned via HTTPS [\#3007](https://github.com/cloudfoundry/stratos/pull/3007)

**Improvements:**

- Endpoint list: Show logged in user's username and whether they're an admin or not. [\#2827](https://github.com/cloudfoundry/stratos/pull/2827)
- Allow front-end to be pre-built [\#2838](https://github.com/cloudfoundry/stratos/pull/2838)
- Deploy App Manifest overrides [\#2924](https://github.com/cloudfoundry/stratos/pull/2924)
- Add restage to application page. [\#2828](https://github.com/cloudfoundry/stratos/pull/2828)
- Extend endpoint registration UI to support Client ID and Client Secret [\#2920](https://github.com/cloudfoundry/stratos/pull/2920)
- Use new Stratos logo on splash/login and about page [\#2919](https://github.com/cloudfoundry/stratos/pull/2919)
- Scalability: Change application list in service instance table row from vertical to chip list [\#2896](https://github.com/cloudfoundry/stratos/issues/2896)
- Scalability: Convert space apps list from local to remote [\#2893](https://github.com/cloudfoundry/stratos/issues/2893)
- Use official CF Stratos logo [\#2892](https://github.com/cloudfoundry/stratos/issues/2892)
- SSO - Enable SSO for all deployment mechanisms [\#2873](https://github.com/cloudfoundry/stratos/issues/2873)
- SSO: Add an option to the setup screen to enable SSO [\#2963](https://github.com/cloudfoundry/stratos/pull/2963)
- SSO: Add initial SSO doc [\#2945](https://github.com/cloudfoundry/stratos/pull/2945)
- SSO: Add flag to indicate if an endpoint has been configured for SSO [\#2939](https://github.com/cloudfoundry/stratos/pull/2939)
- SSO: Add SSO Config options to Helm chart [\#2934](https://github.com/cloudfoundry/stratos/pull/2934)
- SSO: Allow a Cloud Foundry endpoint to be connected with SSO login [\#2928](https://github.com/cloudfoundry/stratos/pull/2928)
- SSO: Link tokens rather than copying them [\#2916](https://github.com/cloudfoundry/stratos/pull/2916)
- Add check to make sure DB Schema migrations have completed [\#2977](https://github.com/cloudfoundry/stratos/pull/2977)
- Extensions: Allow new side nav items to be added [\#2950](https://github.com/cloudfoundry/stratos/pull/2950)
- Extensions: Tidy up customizations and fix logo customization [\#2948](https://github.com/cloudfoundry/stratos/pull/2948)
- Improve GitHub error handling [\#2946](https://github.com/cloudfoundry/stratos/pull/2946)
- Harden app delete e2e test to reduce chance of concurrency failures [\#2942](https://github.com/cloudfoundry/stratos/pull/2942)
- Show 'other apps bound to service instance' warning on delete app service instance step [\#2918](https://github.com/cloudfoundry/stratos/pull/2918)
- Harden the service wall instance card [\#2908](https://github.com/cloudfoundry/stratos/pull/2908)
- Restructure go backend \(with source moves\) [\#2854](https://github.com/cloudfoundry/stratos/pull/2854)
- Improvements to simplify dev experience with go backend [\#2861](https://github.com/cloudfoundry/stratos/pull/2861)
- Added word break to the log viewer [\#2823](https://github.com/cloudfoundry/stratos/pull/2823)
- Remove all tokens associated with a cnsi on unregister, also fix e2e [\#2821](https://github.com/cloudfoundry/stratos/pull/2821)

## [2.0.1](https://github.com/cloudfoundry/stratos/tree/2.0.1) (2018-08-16)
[Full Changelog](https://github.com/cloudfoundry/stratos/compare/2.0.0...2.0.1)

**Fixed bugs:**

- Unable to edit user provided service instances [\#2839](https://github.com/cloudfoundry/stratos/issues/2839)

**Merged pull requests:**

- use cnsi client in deploy.go [\#2843](https://github.com/cloudfoundry/stratos/pull/2843)
- Improve performance [\#2842](https://github.com/cloudfoundry/stratos/pull/2842)
- Pass helm repo branch as an env var to create-chart task [\#2820](https://github.com/cloudfoundry/stratos/pull/2820)
- Update nigthly release pipeline to allow helm repo configuration [\#2819](https://github.com/cloudfoundry/stratos/pull/2819)
- Update index.yaml in gh-pages [\#2818](https://github.com/cloudfoundry/stratos/pull/2818)
- Update README travis badge link to avoid `current` tab confusion [\#2817](https://github.com/cloudfoundry/stratos/pull/2817)


## 2.0.1
[Full Changelog](https://github.com/cloudfoundry/stratos/compare/2.0.0...2.0.1)

This is a bugfix release that fixes an issue that prevents Stratos from correctly building in certain environments.

**Fixes:**

- Upgrade to a versioned release of rxjs-websockets [\#2791](https://github.com/cloudfoundry/stratos/pull/2791)

## 2.0.0 

[Full Changelog since 1.1.0](https://github.com/cloudfoundry/stratos/compare/1.1.0...2.0.0)

This is the second major release of Stratos.

The focus of this release is a new version of the front-end UI in Angular (Stratos version 1 used AngularJS). The UI has undergone numerous updates and we have switched out our own UI component set in favour of Material Design.

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

This release contains all of the fixes and improvements from the 2.0.0 Beta and Release Candidate releases. The additional fixes in this release from [2.0.0-rc3](#2.0.0-release-candidate-3) are:

**Fixes:**
- Fix issue where cookie domain name change can mean you can't log out [\#2732](https://github.com/cloudfoundry/stratos/pull/2732)
- Pagination request: Validation doesn't insert correct value into store [\#2684](https://github.com/cloudfoundry/stratos/issues/2684)


## 2.0.0 Release Candidate 3
[Full Changelog](https://github.com/cloudfoundry/stratos/compare/2.0.0-rc2...2.0.0-rc3)


**Improvements:**
- AOT [\#2594](https://github.com/cloudfoundry/stratos/pull/2594)
- Update BOSH release for V2 [\#2616](https://github.com/cloudfoundry/stratos/pull/2616)
- Navigation loading indicator for slow connections [\#2603](https://github.com/cloudfoundry/stratos/issues/2603)
- Documentation updates [\#2680](https://github.com/cloudfoundry/stratos/pull/2680), [\#2702](https://github.com/cloudfoundry/stratos/pull/2702)
- Minor improvements:  [\#2669](https://github.com/cloudfoundry/stratos/pull/2669), [\#2667](https://github.com/cloudfoundry/stratos/pull/2667), [\#2593](https://github.com/cloudfoundry/stratos/pull/2593)

**Fixes:**
- Fix broken AOT with build optimizer [\#2703](https://github.com/cloudfoundry/stratos/pull/2703)
- App instance count sorting treats the numbers as strings [\#2698](https://github.com/cloudfoundry/stratos/issues/2698)
- No error is reported when an update of service instance fails [\#2696](https://github.com/cloudfoundry/stratos/issues/2696)
- Services Instances Wall says `There are no services` when no service instances exist [\#2692](https://github.com/cloudfoundry/stratos/issues/2692)
- Delete Application shows empty page [\#2682](https://github.com/cloudfoundry/stratos/issues/2682)
- Can not add an organisation [\#2676](https://github.com/cloudfoundry/stratos/issues/2676)
- Use subtle mode fo boolean indicator on CF Pages [\#2523](https://github.com/cloudfoundry/stratos/issues/2523)
- Navigating to a page that has a table that is on page 2 shows an empty list [\#2674](https://github.com/cloudfoundry/stratos/issues/2674)
- Can not collapse security group tag list when there are lots of them [\#2461](https://github.com/cloudfoundry/stratos/issues/2461)
- Fetching connected user roles for permissions only fetches first page [\#2655](https://github.com/cloudfoundry/stratos/issues/2655)
- CF Endpoint Selector takes a while to update after connect/disconnect [\#2643](https://github.com/cloudfoundry/stratos/issues/2643)
- Edit service instances sets plan to first in list, not the current plan. [\#2641](https://github.com/cloudfoundry/stratos/issues/2641)
- Routes not updated after umap [\#2640](https://github.com/cloudfoundry/stratos/issues/2640)
- Create org and space - create button is enabled when empty [\#2636](https://github.com/cloudfoundry/stratos/issues/2636)
- Edit Service Instance is broken [\#2626](https://github.com/cloudfoundry/stratos/issues/2626)
- Reloading Edit Service Instance page results in an exception [\#2625](https://github.com/cloudfoundry/stratos/issues/2625)
- Exception switching back to the Users tab after deleting a role [\#2623](https://github.com/cloudfoundry/stratos/issues/2623)
- Manage User Permission: Pills x button doesn't update the UI [\#2617](https://github.com/cloudfoundry/stratos/issues/2617)
- Remove an org role via the role pill at space level shows `deleting space` message and navs to org spaces [\#2608](https://github.com/cloudfoundry/stratos/issues/2608)
- New spaces are missing from create app steps drop down [\#2592](https://github.com/cloudfoundry/stratos/issues/2592)
- Connected endpoints fail to update sessionData user [\#2590](https://github.com/cloudfoundry/stratos/issues/2590)
- Disconnecting an endpoint after visiting cf pages results in endpoint warning [\#2589](https://github.com/cloudfoundry/stratos/issues/2589)
- Exception thrown in service wall after disconnecting endpoint [\#2582](https://github.com/cloudfoundry/stratos/issues/2582)
- Error logged in backend when disconnecting an endpoint [\#2624](https://github.com/cloudfoundry/stratos/issues/2624)
- Performance: Pagination observable service [\#2556](https://github.com/cloudfoundry/stratos/issues/2556)
- Pagination request: Validation doesn't insert correct value into store [\#2684](https://github.com/cloudfoundry/stratos/issues/2684)
- Fixed bad imports [\#2701](https://github.com/cloudfoundry/stratos/pull/2701)
- Fix routing to appropriate CF view after connecting/disconnecting an endpoint [\#2660](https://github.com/cloudfoundry/stratos/pull/2660)
- Update parent entities at validation time - the end of partial entities [\#2659](https://github.com/cloudfoundry/stratos/pull/2659)
- Restrict non-admin user functions at cf level  [\#2654](https://github.com/cloudfoundry/stratos/pull/2654)
- Don't validate individual org users requests  [\#2651](https://github.com/cloudfoundry/stratos/pull/2651)
- Fix update of User roles table after a role has been removed [\#2630](https://github.com/cloudfoundry/stratos/pull/2630)
- Ensure we don't recursively delete with the action is an update [\#2620](https://github.com/cloudfoundry/stratos/pull/2620)
- Fix three issues around 100+ roles [\#2613](https://github.com/cloudfoundry/stratos/pull/2613)
- Don't copy auth and refresh tokens unless using SSO [\#2611](https://github.com/cloudfoundry/stratos/pull/2611)
- Fix timing issue resulting in an endpoint warning [\#2604](https://github.com/cloudfoundry/stratos/pull/2604)
- Fix Postgres to use same value as detected by VCAP\_SERVICES [\#2600](https://github.com/cloudfoundry/stratos/pull/2600)
- Ensure auth data is updated on sys info call [\#2595](https://github.com/cloudfoundry/stratos/pull/2595)
- Pagination obs performance [\#2561](https://github.com/cloudfoundry/stratos/pull/2561)

## 2.0.0 Release Candidate 2
[Full Changelog](https://github.com/cloudfoundry/stratos/compare/2.0.0-rc1...2.0.0-rc2)

**Improvements:**
- Use consistent icons [\#2517](https://github.com/cloudfoundry/stratos/pull/2517)
- Allow configuration of backend log level [\#2533](https://github.com/cloudfoundry/stratos/pull/2533)


**Fixes:**
- CF/Org/Space selector widget with 1 org and 1 space - user can not proceed [\#2467](https://github.com/cloudfoundry/stratos/issues/2467)
- Error after creating a service instance [\#2473](https://github.com/cloudfoundry/stratos/issues/2473)
- Visit App button never appears when a route is mapped/created [\#2518](https://github.com/cloudfoundry/stratos/issues/2518)
- Cannot create service instance from marketplace or service pages [\#2519](https://github.com/cloudfoundry/stratos/issues/2519)
- Upgrading from v1 to v2 via helm disconnects connected endpoints [\#2527](https://github.com/cloudfoundry/stratos/issues/2527)
- Failed to deploy app due to invalid client ID [\#2532](https://github.com/cloudfoundry/stratos/issues/2532)
- Exception thrown when creating space [\#2560](https://github.com/cloudfoundry/stratos/issues/2560)
- Helm deployment: Upgrade notice can appear for some time if db takes a while to become ready [\#2546](https://github.com/cloudfoundry/stratos/issues/2546)
- Fix assign role for non-admin connected user [\#2562](https://github.com/cloudfoundry/stratos/pull/2562)
- Fix client and client secret issues when pushing apps [\#2553](https://github.com/cloudfoundry/stratos/pull/2553)
- Fix Docker All-in-one image build [\#2552](https://github.com/cloudfoundry/stratos/pull/2552)
- Clean entity service [\#2551](https://github.com/cloudfoundry/stratos/pull/2551)
- Remove base git package to address CVE 2018-11235 [\#2530](https://github.com/cloudfoundry/stratos/pull/2530)
- Entity deletion: Remove child entities [\#2486](https://github.com/cloudfoundry/stratos/pull/2486)


## 2.0.0 Release Candidate 1
[Full Changelog](https://github.com/cloudfoundry/stratos/compare/2.0.0-beta-002...2.0.0-RC-1)

This is the first release candidate of Version 2 of Stratos.

The main focus of this release are bug fixes for release.

**Improvements:**
- Add ingress example and docs for kubernetes deployment [\#2510](https://github.com/cloudfoundry/stratos/pull/2510)

**Fixed bugs:**
- Fix for app count being stuck after adding an app in org card [\#2511](https://github.com/cloudfoundry/stratos/pull/2511)
- Create service instance after connecting a new endpoint did not fetch organisation [\#2472](https://github.com/cloudfoundry/stratos/issues/2472)
- Fixed an issue where we failed to store response from 1 or more endpoints [\#2513](https://github.com/cloudfoundry/stratos/pull/2513)
- Ensure `Remove User` confirmation modal contains correct role prefix [\#2508](https://github.com/cloudfoundry/stratos/pull/2508)
- Fix route schema [\#2506](https://github.com/cloudfoundry/stratos/pull/2506)
- Fixes state reset issue when creating a service instance from different modes [\#2515](https://github.com/cloudfoundry/stratos/pull/2515)

## 2.0.0 Beta 2
[Full Changelog](https://github.com/cloudfoundry/stratos/compare/v2.0.0-beta-001...2.0.0-beta-002)

This is the second Beta release of Version 2 of Stratos. This is a major release.

The main focus of this release are bug fixes and hardening for a first release candidate.

**Improvements:**

- SSO Login Support [\#2491](https://github.com/cloudfoundry/stratos/pull/2491),  [\#2495](https://github.com/cloudfoundry/stratos/pull/2495)
- Add No Javascript message [\#2444](https://github.com/cloudfoundry/stratos/issues/2444)
- Show users without usernames [\#2496](https://github.com/cloudfoundry/stratos/pull/2496)
- Add support for longer timeout for mutating operations \(POST etc\) [\#2401](https://github.com/cloudfoundry/stratos/pull/2401)
- Add Cookie Domain support [\#2432](https://github.com/cloudfoundry/stratos/pull/2432)
- Minor UI improvements [\#2384](https://github.com/cloudfoundry/stratos/pull/2384), [\#2383](https://github.com/cloudfoundry/stratos/pull/2383), [\#2378](https://github.com/cloudfoundry/stratos/pull/2378), [\#2499](https://github.com/cloudfoundry/stratos/pull/2499), [\#2482](https://github.com/cloudfoundry/stratos/pull/2482), [\#2481](https://github.com/cloudfoundry/stratos/pull/2481), [\#2394](https://github.com/cloudfoundry/stratos/pull/2394),  [\#2457](https://github.com/cloudfoundry/stratos/issues/2457), [\#2447](https://github.com/cloudfoundry/stratos/issues/2447)

**Fixes:**

- Error logged in console when reloading to app routes page [\#2493](https://github.com/cloudfoundry/stratos/issues/2493)
- Deal with non CF Jetstream failed requests [\#2497](https://github.com/cloudfoundry/stratos/pull/2497)
- Error after disconnecting an endpoint [\#2460](https://github.com/cloudfoundry/stratos/issues/2460)
- All endpoints are incorrectly shown to be in error state [\#2459](https://github.com/cloudfoundry/stratos/issues/2459)
- When one CF fails, we don't show data for those that succeed. [\#2456](https://github.com/cloudfoundry/stratos/issues/2456)
- Exception on create space stepper when you cancel out [\#2454](https://github.com/cloudfoundry/stratos/issues/2454)
- Error when creating a Space with a space character in the name [\#2451](https://github.com/cloudfoundry/stratos/issues/2451)
- Fix backend error logging [\#2484](https://github.com/cloudfoundry/stratos/pull/2484), [\#2407](https://github.com/cloudfoundry/stratos/pull/2407), [\#2413](https://github.com/cloudfoundry/stratos/pull/2413)
- Fix for panic when res is not set in error logging [\#2441](https://github.com/cloudfoundry/stratos/pull/2441)
- Firefox rendering - focus border on drop-down menu items [\#2446](https://github.com/cloudfoundry/stratos/issues/2446)
- Users Permissions: Removing the last role \(Org User\) results in an exception [\#2438](https://github.com/cloudfoundry/stratos/issues/2438)
- Users Permissions: Assigning a role to a user that has none results in an exception [\#2428](https://github.com/cloudfoundry/stratos/issues/2428)
- Exception thrown when adding space to empty org [\#2418](https://github.com/cloudfoundry/stratos/issues/2418)
- Warn if cookie domain does not match Stratos URL [\#2414](https://github.com/cloudfoundry/stratos/issues/2414)
- Add commit SHA to version when built for Kubernetes/Docker Compose [\#2410](https://github.com/cloudfoundry/stratos/issues/2410)
- Ensure we only raise internal errors on fetch api requests [\#2494](https://github.com/cloudfoundry/stratos/pull/2494)
- Fix failure to update commit info on redeploy [\#2492](https://github.com/cloudfoundry/stratos/pull/2492)
- Fix issue timing issue resulting in  invalid Space Service request [\#2489](https://github.com/cloudfoundry/stratos/pull/2489)
- Improved fix for exception on org screen after fresh load on create space [\#2487](https://github.com/cloudfoundry/stratos/pull/2487)
- Fix layout on summary pages [\#2482](https://github.com/cloudfoundry/stratos/pull/2482)
- Fix error shown when cancelling out of a freshly loaded create space stepper [\#2478](https://github.com/cloudfoundry/stratos/pull/2478)
- Users tables: Only show org/space name in pills when needed [\#2443](https://github.com/cloudfoundry/stratos/pull/2443)
- Fix issue where space count is wrong after deleting a space [\#2439](https://github.com/cloudfoundry/stratos/pull/2439)
- Update the connected user roles section of store on roles change [\#2435](https://github.com/cloudfoundry/stratos/pull/2435)
- Fix list state \(deleting/etc\) [\#2434](https://github.com/cloudfoundry/stratos/pull/2434)
- Fix exception when a space is added to an empty org [\#2433](https://github.com/cloudfoundry/stratos/pull/2433)
- Fix exception thrown when only assign an org user role [\#2430](https://github.com/cloudfoundry/stratos/pull/2430)
- Fix pagination of space level routes and service instance tables [\#2429](https://github.com/cloudfoundry/stratos/pull/2429)
- Disable removal of `org user` role if user has others [\#2427](https://github.com/cloudfoundry/stratos/pull/2427)
- Show an overlay and deleting message when deleting from a card or table action. [\#2415](https://github.com/cloudfoundry/stratos/pull/2415)
- Fix errors when multiple cf's are connected as both admin and non-admin users [\#2409](https://github.com/cloudfoundry/stratos/pull/2409)
- Fix not detecting admin user is admin scope is not stratos.admin [\#2403](https://github.com/cloudfoundry/stratos/pull/2403)
- Table loading init [\#2412](https://github.com/cloudfoundry/stratos/pull/2412)
- Users Table: Restrict org/space roles and prefix space name with org... depending on depth [\#2402](https://github.com/cloudfoundry/stratos/pull/2402)
- CfOrgSpace Selector: Fix overzealous `no orgs` error message [\#2397](https://github.com/cloudfoundry/stratos/pull/2397)
- Org space list - Deleting causes exceptions in other parts of the org page. [\#2393](https://github.com/cloudfoundry/stratos/pull/2393)
- Fix infinite user list's loading indicator when connected as user with no roles [\#2390](https://github.com/cloudfoundry/stratos/pull/2390)
- Fix TCP route creation and improve UI [\#2388](https://github.com/cloudfoundry/stratos/pull/2388)
- Add global deleting overlay for entity summary pages [\#2373](https://github.com/cloudfoundry/stratos/pull/2373)
- Fix various application deploy bugs [\#2372](https://github.com/cloudfoundry/stratos/pull/2372)


## 2.0.0 Beta 1

[Full Changelog](https://github.com/cloudfoundry/stratos/compare/1.0.2...v2.0.0-beta-001)

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

## 1.1.0 Release

[Full Changelog](https://github.com/cloudfoundry/stratos/compare/1.0.2...1.1.0)

**Improvements:**

- Added support for SUSE Cloud Foundry 1.1 configuration values to the Helm chart [\#1950](https://github.com/cloudfoundry/stratos/pull/1950)

**Fixes:**

- Fix width of top nav bar menu's bottom border [\#1739](https://github.com/cloudfoundry/stratos/pull/1739)

## 1.0.2 Release

[Full Changelog](https://github.com/cloudfoundry/stratos/compare/1.0.0...1.0.2)

**Improvements:**

- Added Confirmation prompts for stopping and restarting apps [\#1437](https://github.com/cloudfoundry/stratos/pull/1437)

**Fixes:**

- Memory and disk usage should respect the number of app instances [\#1625](https://github.com/cloudfoundry/stratos/pull/1625)
- Fix issue around apps and routes missing from space entity [\#1447](https://github.com/cloudfoundry/stratos/pull/1447)
- Fix minor localisation issue [\#1596](https://github.com/cloudfoundry/stratos/pull/1596)

## 1.0.0 Release

[Full Changelog](https://github.com/cloudfoundry/stratos/compare/0.9.9...1.0.0)

**Improvements:**
- Added French localization (*Open Source build only*) [\#1419](https://github.com/cloudfoundry/stratos/pull/1419)

**Fixes:**
- Removed dependency `jsdocs` because of security vulnerability [\#1428](https://github.com/cloudfoundry/stratos/pull/1428)
- Fix vertical alignment for setup screens (*Open Source build only*) [\#1417](https://github.com/cloudfoundry/stratos/pull/1417)

## 0.9.9 Release Candidate 1 Release

[Full Changelog](https://github.com/cloudfoundry/stratos/compare/0.9.8...0.9.9)

This is the first Release Candidate of the Stratos UI Console. It contains the following improvements:

**Improvements:**

- Open Source build now uses a generic theme [\#1403](https://github.com/cloudfoundry/stratos/pull/1403)
- SUSE build uses SUSE theme and contains EULA in the about screen [\#1404](https://github.com/cloudfoundry/stratos/pull/1404)
- Run Mariadb mysqld process as mysql user [\#1397](https://github.com/cloudfoundry/stratos/pull/1397)
- Helm Chart: Persistent Volume size increased from 1Mi to 20Mi to avoid issues with some storage providers [\#1409](https://github.com/cloudfoundry/stratos/pull/1409)

## 0.9.8 Beta-3 Release 2

[Full Changelog](https://github.com/cloudfoundry/stratos/compare/0.9.7...0.9.8)

This is an update of the third beta release of the Stratos UI Console. It contains the following bug fixes and improvements:

**Improvements:**

- Improve display of byte usage information for small numbers [\#1388](https://github.com/cloudfoundry/stratos/pull/1388)
- Remove the yellow autocomplete background in dark form fields [\#1372](https://github.com/cloudfoundry/stratos/pull/1372)
- Helm Chart: Create Image pull secret for secure repositories [\#1387](https://github.com/cloudfoundry/stratos/pull/1387)
- Helm Chart: Remove `shared` mode [\#1385](https://github.com/cloudfoundry/stratos/pull/1385)

**Fixes:**

- Fix link shown on cf dashboard when no endpoints connected [\#1369](https://github.com/cloudfoundry/stratos/pull/1369)
- Fix leak of Persistent volume claims when deleting Helm deployed release [\#1368](https://github.com/cloudfoundry/stratos/pull/1368)
- Remove legacy images and associated files [\#1390](https://github.com/cloudfoundry/stratos/pull/1390)
- Fix unsafe casting for mysql Service [\#1381](https://github.com/cloudfoundry/stratos/pull/1381)

## 0.9.7 Beta-3 Release

[Full Changelog](https://github.com/cloudfoundry/stratos/compare/0.9.6...0.9.7)

This is the third beta release of the Stratos UI Console. It contains the following bug fixes:

**Fixes:**
- Updated Helm Chart to remove delete job when running in noShared mode [\#1364](https://github.com/cloudfoundry/stratos/pull/1364)
- Updated Helm Chart to support common storage class for MariaDB and console [\#1363](https://github.com/cloudfoundry/stratos/pull/1363)
- Updated Helm Chart to remove `postgres-client` from postflight job [\#1358](https://github.com/cloudfoundry/stratos/pull/1358)
- Updated Helm Chart to remove noShared backend container image [\#1357](https://github.com/cloudfoundry/stratos/pull/1357)

## 0.9.6 Beta-2 Release

[Full Changelog](https://github.com/cloudfoundry/stratos/compare/0.9.5...0.9.6)

This is the second beta release of the Stratos UI Console. It contains the following bug fixes and improvements:

**Improvements:**

- Add ability to edit a service instance [\#1324](https://github.com/cloudfoundry/stratos/pull/1324)
- Improve URL validation on setup flow [\#1320](https://github.com/cloudfoundry/stratos/pull/1320)
- Make search boxes not usable and visually show this while fetching orgs and spaces [\#1287](https://github.com/cloudfoundry/stratos/pull/1287)
- Make sure the expiry date time is relative to the time as the client sees it [\#1299](https://github.com/cloudfoundry/stratos/pull/1299)
- Add loading indicators to endpoints and Cloud Foundry dashboards [\#1325](https://github.com/cloudfoundry/stratos/pull/1325)
- Improve the loading indicators on initial console load [\#1286](https://github.com/cloudfoundry/stratos/pull/1286)
- Move deploy status and title into the log viewer title bar. [\#1277](https://github.com/cloudfoundry/stratos/pull/1277)
- Upgrade to Angular 1.6 [\#1307](https://github.com/cloudfoundry/stratos/pull/1307)
- Enable binding of mysql db service to CF hosted console [\#1260](https://github.com/cloudfoundry/stratos/pull/1260)
- Add support for a backend healthcheck [\#1321](https://github.com/cloudfoundry/stratos/pull/1321)
- Allow helm scf-values to be used to deploy the console [\#1344](https://github.com/cloudfoundry/stratos/pull/1344)
- Add ability to configure UAA settings when deploying UI through helm chart [\#1315](https://github.com/cloudfoundry/stratos/pull/1315)
- Use custom buildpack to build Stratos UI [\#1283](https://github.com/cloudfoundry/stratos/pull/1283)
- Migrate container images to opensuse:42.3 base [\#1293](https://github.com/cloudfoundry/stratos/pull/1293)
- Replace goose with custom database migrator [\#1334](https://github.com/cloudfoundry/stratos/pull/1334)

**Fixes:**

- Fix for app wall cf/org/space context not carrying over to deploy-location selector [\#1273](https://github.com/cloudfoundry/stratos/pull/1273)
- Add a logout button when only the error page is shown [\#1289](https://github.com/cloudfoundry/stratos/pull/1289)
- Address minor bugs in the deploy application for github [\#1285](https://github.com/cloudfoundry/stratos/pull/1285)
- Fix incorrect service summary info shown [\#1306](https://github.com/cloudfoundry/stratos/pull/1306)
- Fix i10n for empty/no app events [\#1303](https://github.com/cloudfoundry/stratos/pull/1303)
- Staging fails when pushed from Windows [\#1322](https://github.com/cloudfoundry/stratos/issues/1322)
- Properly kill upgrade echo instance [\#1311](https://github.com/cloudfoundry/stratos/pull/1311)
- Helm chart: Switch to `noShared` mode by default to support more setups [\#1295](https://github.com/cloudfoundry/stratos/pull/1295)
- Kubernetes/GCE: Skip HTTP endpoint when a load balancer is being setup [\#1305](https://github.com/cloudfoundry/stratos/pull/1305)
- Fix typo in error message of sshHostKeyChecker [\#1294](https://github.com/cloudfoundry/stratos/pull/1294)
- Fix line endings [\#1332](https://github.com/cloudfoundry/stratos/pull/1332)


## 0.9.5 Beta-1 Release

[Full Changelog](https://github.com/cloudfoundry/stratos/compare/0.9.2...0.9.5)

This is the first beta release of the Stratos UI Console. It contains the following bug fixes and improvements:

**Improvements:**

- Added support for parameters when creating/binding services [\#1253](https://github.com/cloudfoundry/stratos/pull/1253)
- Added support for tags when creating service instances [\#1252](https://github.com/cloudfoundry/stratos/pull/1252)
- Moved service instances to a new Application tab [\#1237](https://github.com/cloudfoundry/stratos/pull/1237)
- Show deployment information in Application summary for console deployed apps [\#1243](https://github.com/cloudfoundry/stratos/pull/1243)
- Minor UI tweaks following UX review [\#1249](https://github.com/cloudfoundry/stratos/pull/1249)
- Pre-sort service instances in cloud foundry space instances table [\#1233](https://github.com/cloudfoundry/stratos/pull/1233)
- Enable binding of postgres CF db service to CF hosted console [\#1231](https://github.com/cloudfoundry/stratos/pull/1231)
- Migrate Helm chart to use MariaDB instead of Postgres [\#1230](https://github.com/cloudfoundry/stratos/pull/1230)
- Added initial BOSH Release [\#1222](https://github.com/cloudfoundry/stratos/pull/1222)
- Improve SSL certificate handling when deploying through Helm [\#1210](https://github.com/cloudfoundry/stratos/pull/1210)
- Added ability to deploy application from a git url [\#1208](https://github.com/cloudfoundry/stratos/pull/1208)

**Fixes:**

- Fixed a couple of minor translation issues [\#1247](https://github.com/cloudfoundry/stratos/pull/1247)
- Fix for broken cf push [\#1244](https://github.com/cloudfoundry/stratos/pull/1244)
- Fix for translation issue on the landing page language options [\#1234](https://github.com/cloudfoundry/stratos/pull/1234)
- Fixed filtering by text/endpoint bug [\#1268](https://github.com/cloudfoundry/stratos/pull/1268)
- Fix for missing icon for the busy state [\#1267](https://github.com/cloudfoundry/stratos/pull/1267)
- Fixed incorrect caching and reset behaviour of app wall filters [\#1248](https://github.com/cloudfoundry/stratos/pull/1248)
- Fixed create app issues related to route visibility/permissions [\#1246](https://github.com/cloudfoundry/stratos/pull/1246)

## 0.9.2 Alpha-3 Release
[Full Changelog](https://github.com/cloudfoundry/stratos/compare/0.9.1...0.9.2)

Third alpha release containing the following bug fixes and minor improvements:

- Fix a few service instance bugs [\#1226](https://github.com/cloudfoundry/stratos/pull/1226)
- Fixes issues where trailing slash in CF endpoint causes problems [\#1224](https://github.com/cloudfoundry/stratos/pull/1224)
- Reuse unbound routes [\#1223](https://github.com/cloudfoundry/stratos/pull/1223)
- Optionally enable endpoints-dashboard via env var for use in cf push [\#1221](https://github.com/cloudfoundry/stratos/pull/1221)
- Use stable name for docker registry in CI pipelines [\#1220](https://github.com/cloudfoundry/stratos/pull/1220)
- Improve documentation [\#1219](https://github.com/cloudfoundry/stratos/pull/1219)
- Add upgrade documentation for helm repository based installation [\#1218](https://github.com/cloudfoundry/stratos/pull/1218)
- Update CI piplines for environment [\#1217](https://github.com/cloudfoundry/stratos/pull/1217)
- Fixed docker image name for all-in-one deployment [\#1216](https://github.com/cloudfoundry/stratos/pull/1216)
- Persist app wall selection of cf/org/space in local storage [\#1214](https://github.com/cloudfoundry/stratos/pull/1214)
- Fix 'remove' i10n in create space modal [\#1213](https://github.com/cloudfoundry/stratos/pull/1213)
- Fix terminate instance UI [\#1211](https://github.com/cloudfoundry/stratos/pull/1211)
- Fix issue where previously selected language was not shown on landing page [\#1209](https://github.com/cloudfoundry/stratos/pull/1209)
- Add missing defaults to values.yaml [\#1207](https://github.com/cloudfoundry/stratos/pull/1207)
- Fix localisation in unmap route from apps modal \(unmap route from app is fine\) [\#1206](https://github.com/cloudfoundry/stratos/pull/1206)
- Split deploy app wizard service into smaller chunks [\#1202](https://github.com/cloudfoundry/stratos/pull/1202)
- UX Review: Update landing page \(login + setup screens\) [\#1200](https://github.com/cloudfoundry/stratos/pull/1200)
- Remember grid or list state for the app wall [\#1199](https://github.com/cloudfoundry/stratos/pull/1199)

## 0.9.1 Alpha-2 Release
[Full Changelog](https://github.com/cloudfoundry/stratos/compare/0.9.0...0.9.1)

Second alpha release contains the following fixes:

- Improved documentation when deploying using Helm  [\#1201](https://github.com/cloudfoundry/stratos/pull/1201)
- Added the ability to deploy the Console helm chart without using shared volumes, to make it easier to deploy in multi-node clusters with basic storage provisioner such as `hostpath` [\#1204](https://github.com/cloudfoundry/stratos/pull/1204)
- Specified the `cflinuxfs2` stack to the CF manifest.yaml, since default CAASP stack `opensuse42` is unable to deploy the app  [\#1205](https://github.com/cloudfoundry/stratos/pull/1205)
- Changed root of the volume mount for Postgres in kubernetes to address permission issue in certain environments  [\#1203](https://github.com/cloudfoundry/stratos/pull/1203)

## 0.9.0 Alpha-1 Release

First Alpha release of the Stratos UI Console.

For information on the Alpha feature set and on deploying the Console, please start with the main [README](https://github.com/cloudfoundry/stratos/blob/0.9.0/README.md) documentation.
