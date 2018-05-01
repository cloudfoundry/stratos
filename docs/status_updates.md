# Status Updates

Weekly status updates are published here.

## 27 April 2018

The team have been working on the following issues this week:

- GitHub tab/deploy updates [#2067](https://github.com/cloudfoundry-incubator/stratos/issues/2067) - When deploying an application from GitHub, we now allow the user to select a commit from their selected branch. When viewing the GitHub tab of an application, the user can see the list of commits and update the application from a different commit on the branch.

- Deploy App: Add support for an archive file or local folder  [#2040](https://github.com/cloudfoundry-incubator/stratos/issues/2040) - In addition to Git deployment, users can now browse to a local application archive file or folder and deploy using that.

- User Profile: Implement edit and password change as per V1 [#2062](https://github.com/cloudfoundry-incubator/stratos/issues/2040) - Users can now edit their profile metadata and change their password.

- Create & List Service Instances - [#2086](https://github.com/cloudfoundry-incubator/stratos/pull/2086) - adding the ability to view and create Service Instances.

- Delete App should show dependencies and allow optional deletion [#2044](https://github.com/cloudfoundry-incubator/stratos/pull/2044) - when deleting and application the user is shown the application dependencies(routes, service instances) and is able to delete these with the application or leave them in place for use by other applications

- Cloud Foundry: Manage Users [#1541](https://github.com/cloudfoundry-incubator/stratos/issues/1541) - re-introducing the equivalent features that V1 has allowing user to manage user roles across Cloud Foundry