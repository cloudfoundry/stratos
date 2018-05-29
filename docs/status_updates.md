# Status Updates

Weekly status updates are published here.

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
