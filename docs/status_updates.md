# Status Updates

Weekly status updates are published here.

## 08 June 2018

The team have been working on the following issues and PRs this week:

- Front-end unit tests are unreliable in Travis [#3208](https://github.com/cloudfoundry-incubator/stratos/issues/2308) - we're seeing a lot of problems with the front-end unit tests when running in Travis - we're continuing to dig into this issue to understand what the cause is, since this is affecting reliability of PR gate checks.

- Services permissions [#2284](https://github.com/cloudfoundry-incubator/stratos/pull/2284) - wiring the user permissions service into the Service UI to ensure users are only presented with actions that they are permitted to perform.

- Allow metrics endpoint token to be shared [#2283](https://github.com/cloudfoundry-incubator/stratos/pull/2283) - adding support for the admin user to connect to a Prometheus metrics endpoint and then make that connection available to all users. Note that non-admins can only see metrics for applications that they have permission to view.

- Show whether user is an admin on the about page [#2306](https://github.com/cloudfoundry-incubator/stratos/pull/2306) - we now indicate on the about page if the current user is an administrator of Stratos.

- Add Permissions to CF Users tables [#2291](https://github.com/cloudfoundry-incubator/stratos/pull/2291) - wired in the user permissions service into the Cloud Foundry user management UI.

- Wire in actions to app state [#2288](https://github.com/cloudfoundry-incubator/stratos/pull/2288) - actions on the application view now use the same rules as in V1 to determine which actions should be shown based on the current application state.

- Quicker e2e tests for PRs  [#2273](https://github.com/cloudfoundry-incubator/stratos/pull/2273) - changed the way e2e tests run for PRs. They will now use a quicker local deployment rather than a full deployment in docker.

- Only show add and deploy buttons when there is at least 1 connected CF [#2285](https://github.com/cloudfoundry-incubator/stratos/pull/2285) - we now only show the add and deploy buttons on the application wall when there is a Cloud Foundry available.

- Fetch cf users when not cf admin [#2282](https://github.com/cloudfoundry-incubator/stratos/pull/2282) - ensuring that we use different APIs call when the user is not an admin in order to retrieve the data to display for the user list.

- Hide service broker card if broker information isn't available [#2287](https://github.com/cloudfoundry-incubator/stratos/pull/2287) - we now hide the service broker card if we can not retrieve the broker metadata.

- Only allow password change if user has password.write scope [#2278](https://github.com/cloudfoundry-incubator/stratos/pull/2278) - user is now only presented with the option to change their password if they have permission to do so.

- Backend logging improvements [#2267](https://github.com/cloudfoundry-incubator/stratos/pull/2267) - first round of tidy up to the back-end logging, including not logging an error when verifying the user's seesion when they don't have a valid session.

- Use local fonts [#2260](https://github.com/cloudfoundry-incubator/stratos/pull/2260) - all fonts are now served up by the app itself to allow air-gapped deployment.

- Endpoint confirmation modals [#2258](https://github.com/cloudfoundry-incubator/stratos/pull/2258) - added confirmation modals when disconnecting or un-registering and endpoint.

- Added theming section to developer guide readme [#2249](https://github.com/cloudfoundry-incubator/stratos/pull/2249) - added documentation on how theming is done for Stratos.

- Update permissions when when entities are updated [#2221](https://github.com/cloudfoundry-incubator/stratos/pull/2221) - we now ensure that permissions are updated when endpoints (and other entities) are updated in Stratos.

## 01 June 2018

The team have been working on the following issues and PRs this week:

- Upgrade to Angular 6 [#2227](https://github.com/cloudfoundry-incubator/stratos/pull/2227) - Completed work and testing. Will merge early next week.

- Edit service instance from Services Wall [#2233](https://github.com/cloudfoundry-incubator/stratos/pull/2233) - Added ability to edit an existing service instance.

- E2E Tests [#1523](https://github.com/cloudfoundry-incubator/stratos/issues/1523) - Continuing to extend E2E test suite.

- Fix compression issue [#2248](https://github.com/cloudfoundry-incubator/stratos/pull/2248) - Fixed an issue when Stratos accessed a Cloud Foundry instance with gzip compression enabled. Thanks to everyone for their help with this one.

- Fix App SSH (Broken when auth and token endpoints are different) [#2250](https://github.com/cloudfoundry-incubator/stratos/pull/2250) - Fixed an issue with Application SSH for some CF deplyoments.

- Fix application issue on reload when served by backend [#2238](https://github.com/cloudfoundry-incubator/stratos/pull/2238) - Fixed an issue where refreshing the browser on application pages resulted in a 404 (when deployed via cf push)



## 25 May 2018

The team have been working on the following issues and PRs this week:

- Upgrade to Angular 6 [#2227](https://github.com/cloudfoundry-incubator/stratos/pull/2227)

- Handle async request progress/success/failure in modals [#2223](https://github.com/cloudfoundry-incubator/stratos/pull/2223) - Improving busy state and error feedback in modals - e.g. when creating an application, creating a space etc

- Service Summary tab [#2219](https://github.com/cloudfoundry-incubator/stratos/pull/2219) - add a summary tab to the view for a service, to show summary metadata

- Add support for back-end custom plugins [#2217](https://github.com/cloudfoundry-incubator/stratos/pull/2217)

- Apply user permissions to CF pages (2) [#2212](https://github.com/cloudfoundry-incubator/stratos/pull/2212) - Completion of work to wire in user permissions into the Cloud Foundry view


## 18 May 2018

The team have been working on the following issues and PRs this week:

- User permissions [#2147](https://github.com/cloudfoundry-incubator/stratos/pull/2147) - adding in the framework to control UI elements based on the user's permissions

- Apply user permissions to CF pages [#2198](https://github.com/cloudfoundry-incubator/stratos/pull/2198) - appropriately show the CF actions a user can perform based on their permissions

- Service instances view [#2074](https://github.com/cloudfoundry-incubator/stratos/issues/2074) - adding a view to show service instances

- Services Wall: Create Services instance [#2163](https://github.com/cloudfoundry-incubator/stratos/pull/2163) - adding support for creating service instances from the service marketplace view

- App Services tab: Allow user to bind a service instance [#2188](https://github.com/cloudfoundry-incubator/stratos/pull/2188)

- E2E Tests and E2E Test setup improvements [#2183](https://github.com/cloudfoundry-incubator/stratos/pull/2183)

- Add support for Angular XSRF protection [#2153](https://github.com/cloudfoundry-incubator/stratos/pull/2153) - adding support for the Angular XSRF protection mechanism

- Remove deprecated API & Add confirmation dialogs when detaching/removing service bindings [#2193](https://github.com/cloudfoundry-incubator/stratos/pull/2193)




## 11 May 2018

The work to get V2 to the same level of functionality as V1 is going well and we're nearing completion - the team have been working on the following issues and PRs this week:

- Add restart app button [#2140](https://github.com/cloudfoundry-incubator/stratos/pull/2140) - adding restart action to applications

- CF Push: Bump up memory further [#2135](https://github.com/cloudfoundry-incubator/stratos/pull/2135) - increase memory when pushing to work around the memory-hungry Angular compiler

- Service instances view [#2074](https://github.com/cloudfoundry-incubator/stratos/issues/2074) - adding a view to show service instances

- User permissions [#2147](https://github.com/cloudfoundry-incubator/stratos/pull/2147) - adding in the framework to control UI elements based on the user's permissions

- Customizations [#2133](https://github.com/cloudfoundry-incubator/stratos/pull/2133) - initial support for customizing Stratos (theme etc)

- E2E Tests [#1523](https://github.com/cloudfoundry-incubator/stratos/issues/1523) - putting in place the E2E framework for V2, getting this working in Travis and porting over the V1 Endpoints tests.

- Delete App should show dependencies and allow optional deletion [#2044](https://github.com/cloudfoundry-incubator/stratos/pull/2044) - when deleting an application the user is shown the application dependencies (routes, service instances) and is able to delete these with the application or leave them in place for use by other applications

- Cloud Foundry: Manage Users [#1541](https://github.com/cloudfoundry-incubator/stratos/issues/1541) - re-introducing the equivalent features that V1 has allowing user to manage user roles across Cloud Foundry

## 4 May 2018

The team have been working on the following issues and PRs this week:

- E2E Tests [#1523](https://github.com/cloudfoundry-incubator/stratos/issues/1523) - putting in place the E2E framework for V2, getting this working in Travis and porting over the V1 Endpoints tests.

- Delete App should show dependencies and allow optional deletion [#2044](https://github.com/cloudfoundry-incubator/stratos/pull/2044) - when deleting an application the user is shown the application dependencies (routes, service instances) and is able to delete these with the application or leave them in place for use by other applications

- Cloud Foundry: Manage Users [#1541](https://github.com/cloudfoundry-incubator/stratos/issues/1541) - re-introducing the equivalent features that V1 has allowing user to manage user roles across Cloud Foundry

- Implement Create Service Instance [#2043](https://github.com/cloudfoundry-incubator/stratos/issues/2043) - adding support for creating service instances

- Service Instance creation: Support space-scoped broker provided plans [#2111](https://github.com/cloudfoundry-incubator/stratos/pull/2111)

- Make Service Instance creation wizard service plan visibility aware [#2109](https://github.com/cloudfoundry-incubator/stratos/pull/2109)

- Return better error information from API passthroughs [#2084](https://github.com/cloudfoundry-incubator/stratos/pull/2085)

## 27 April 2018

The team have been working on the following issues this week:

- GitHub tab/deploy updates [#2067](https://github.com/cloudfoundry-incubator/stratos/issues/2067) - When deploying an application from GitHub, we now allow the user to select a commit from their selected branch. When viewing the GitHub tab of an application, the user can see the list of commits and update the application from a different commit on the branch.

- Deploy App: Add support for an archive file or local folder  [#2040](https://github.com/cloudfoundry-incubator/stratos/issues/2040) - In addition to Git deployment, users can now browse to a local application archive file or folder and deploy using that.

- User Profile: Implement edit and password change as per V1 [#2062](https://github.com/cloudfoundry-incubator/stratos/issues/2040) - Users can now edit their profile metadata and change their password.

- Create & List Service Instances - [#2086](https://github.com/cloudfoundry-incubator/stratos/pull/2086) - adding the ability to view and create Service Instances.

- Delete App should show dependencies and allow optional deletion [#2044](https://github.com/cloudfoundry-incubator/stratos/pull/2044) - when deleting and application the user is shown the application dependencies(routes, service instances) and is able to delete these with the application or leave them in place for use by other applications

- Cloud Foundry: Manage Users [#1541](https://github.com/cloudfoundry-incubator/stratos/issues/1541) - re-introducing the equivalent features that V1 has allowing user to manage user roles across Cloud Foundry
