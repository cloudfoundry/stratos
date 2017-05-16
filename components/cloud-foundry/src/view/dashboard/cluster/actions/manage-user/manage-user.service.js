(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.dashboard.cluster')
    .factory('appClusterManageUsers', ManageUsersFactory);

  /**
   * @memberof cloud-foundry.view.dashboard.cluster
   * @name AssignUsersWorkflowController
   * @constructor
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {object} frameworkAsyncTaskDialog - our async dialog service
   * @param {object} appClusterRolesService - our roles service, used to create/handle data from roles tables
   * @param {object} cfOrganizationModel - the cfOrganizationModel service
   */
  function ManageUsersFactory(modelManager, frameworkAsyncTaskDialog, appClusterRolesService, cfOrganizationModel) {

    var authModel = modelManager.retrieve('cloud-foundry.model.auth');

    var selectedRoles = {};

    var removeFromOrg = function (orgGuid) {
      appClusterRolesService.clearOrg(selectedRoles[orgGuid]);
    };

    var containsRoles = function (orgGuid) {
      return appClusterRolesService.orgContainsRoles(selectedRoles[orgGuid]);
    };

    var clearAllOrgs = function () {
      appClusterRolesService.clearOrgs(selectedRoles);
    };

    /**
     * @name ManageUsersFactory.show
     * @description Show the manage users slide out
     * @param {string} clusterGuid guid of the HCF cluster
     * @param {string} organizationGuid guid of the organization to show
     * @param {object} users collection of users to pre-select
     * @returns {promise} promise fulfilled when dialogue has closed
     */
    this.show = function (clusterGuid, organizationGuid, users) {

      selectedRoles = {};
      var organizations = _.omitBy(cfOrganizationModel.organizations[clusterGuid], function (org, orgGuid) {
        // Is it the single org we're looking for?
        if (organizationGuid) {
          return organizationGuid !== orgGuid;
        }
        return !authModel.isOrgOrSpaceActionableByResource(clusterGuid, org, authModel.actions.update);
      });

      // Ensure that the selected roles objects are initialised correctly. The roles table will then fiddle faddle
      // mc terry flop inside these. Also determine if the connected user can edit all orgs or we should disable the
      // clear all roles button
      var disableClearAll = false;
      _.forEach(organizations, function (organization) {
        selectedRoles[organization.details.org.metadata.guid] = {};
        disableClearAll = disableClearAll || !authModel.isAllowed(clusterGuid,
            authModel.resources.organization,
            authModel.actions.update,
            organization.details.org.metadata.guid);
      });

      // Async refresh roles
      var state = {
        initialised: true
      };

      // Make the actual user role changes
      var updateUsers = function () {
        return appClusterRolesService.updateUsers(clusterGuid, users, selectedRoles);
      };

      return frameworkAsyncTaskDialog(
        {
          title: users.length < 2
            ? gettext('Manager User: ') + users[0].entity.username
            : gettext('Change User\'s Roles'),
          templateUrl: 'plugins/cloud-foundry/view/dashboard/cluster/actions/manage-user/manage-user.html',
          buttonTitles: {
            submit: gettext('Save Changes')
          }
        },
        {
          data: {
            organizations: organizations,
            organizationsArray: _.orderBy(organizations, 'details.created_at', 'desc')
          },
          selectedRoles: selectedRoles,
          tableConfig: {
            clusterGuid: clusterGuid,
            orgRoles: appClusterRolesService.organizationRoles,
            spaceRoles: appClusterRolesService.spaceRoles,
            users: users,
            removeFromOrg: removeFromOrg,
            containsRoles: containsRoles,
            showExistingRoles: users.length < 2,
            disableClearAll: disableClearAll
          },
          state: state,
          clearSelections: clearAllOrgs,
          disableAsyncIndicator: true
        },
        updateUsers
      );
    };

    return this;
  }
})();
