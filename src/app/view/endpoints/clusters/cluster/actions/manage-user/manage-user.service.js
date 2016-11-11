(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster')
    .factory('app.view.endpoints.clusters.cluster.manageUsers', ManageUsersFactory);

  ManageUsersFactory.$inject = [
    'app.model.modelManager',
    'helion.framework.widgets.asyncTaskDialog',
    'app.view.endpoints.clusters.cluster.rolesService'
  ];

  /**
   * @memberof app.view.endpoints.clusters.cluster
   * @name AssignUsersWorkflowController
   * @constructor
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {object} asyncTaskDialog - our async dialog service
   * @param {object} rolesService - our roles service, used to create/handle data from roles tables
   */
  function ManageUsersFactory(modelManager, asyncTaskDialog, rolesService) {

    var organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
    var authModel = modelManager.retrieve('cloud-foundry.model.auth');

    var selectedRoles = {};

    var removeFromOrg = function (orgGuid) {
      rolesService.clearOrg(selectedRoles[orgGuid]);
    };

    var containsRoles = function (orgGuid) {
      return rolesService.orgContainsRoles(selectedRoles[orgGuid]);
    };

    var clearAllOrgs = function () {
      rolesService.clearOrgs(selectedRoles);
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
      var organizations = _.omitBy(organizationModel.organizations[clusterGuid], function (org, orgGuid) {
        // Is it the single org we're looking for?
        if (organizationGuid) {
          return organizationGuid !== orgGuid;
        }
        return !authModel.isOrgOrSpaceActionableByResource(clusterGuid, org, authModel.resources.organization,
          authModel.actions.update);
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
        return rolesService.updateUsers(clusterGuid, users, selectedRoles);
      };

      return asyncTaskDialog(
        {
          title: users.length < 2
            ? gettext('Manager User: ') + users[0].entity.username
            : gettext('Change User\'s Roles'),
          templateUrl: 'app/view/endpoints/clusters/cluster/actions/manage-user/manage-user.html',
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
            orgRoles: rolesService.organizationRoles,
            spaceRoles: rolesService.spaceRoles,
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
