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

    var selectedRoles = {};
    var originalSelectedRoles = {};

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
     * @param {object} clusterGuid guid of the HCF cluster
     * @param {object} users collection of users to pre-select
     * @param {boolean} refreshSpaceRoles true if the space roles should be updated
     * @returns {promise} promise fulfilled when dialogue has closed
     */
    this.show = function (clusterGuid, users, refreshSpaceRoles) {

      selectedRoles = {};
      var organizations = organizationModel.organizations[clusterGuid];

      // Ensure that the selected roles objects are initialised correctly. The roles table will then fiddle inside these
      _.forEach(organizations, function (organization) {
        selectedRoles[organization.details.org.metadata.guid] = {};
        originalSelectedRoles[organization.details.org.metadata.guid] = {};
      });

      // Async refresh roles
      var state = {};
      var initPromise = rolesService.refreshRoles(clusterGuid, refreshSpaceRoles)
        .then(function () {
          state.initialised = true;
        })
        .catch(function () {
          state.initialised = false;
        });

      // Make the actual user role changes
      var updateUsers = function () {
        return rolesService.updateUsers(clusterGuid, users, originalSelectedRoles, selectedRoles);
      };

      return asyncTaskDialog(
        {
          title: users.length === 1 ? gettext('Manager User: ') + users[0].entity.username : 'TEAMFOUR-708',
          templateUrl: 'app/view/endpoints/clusters/cluster/actions/manage-user/manage-user.html',
          buttonTitles: {
            submit: gettext('Save Changes')
          }
        },
        {
          data: {
            organizations: organizations
          },
          selectedRoles: selectedRoles,
          originalSelectedRoles: originalSelectedRoles,
          tableConfig: {
            clusterGuid: clusterGuid,
            orgRoles: rolesService.organizationRoles,
            spaceRoles: rolesService.spaceRoles,
            users: users,
            initPromise: initPromise,
            removeFromOrg: removeFromOrg,
            containsRoles: containsRoles,
            showExistingRoles: true
          },
          state: state,
          clearSelections: clearAllOrgs
        },
        updateUsers
      );
    };

    return this;
  }
})();
