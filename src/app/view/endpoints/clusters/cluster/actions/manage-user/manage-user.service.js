(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster')
    .factory('app.view.endpoints.clusters.cluster.manageUsers', ManageUsersFactory);

  ManageUsersFactory.$inject = [
    '$q',
    'app.model.modelManager',
    'helion.framework.widgets.asyncTaskDialog',
    'app.view.endpoints.clusters.cluster.rolesService'
  ];

  /**
   * @memberof app.view.endpoints.clusters.cluster
   * @name AssignUsersWorkflowController
   * @constructor
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {object} context - the context for the modal. Used to pass in data
   * @param {object} rolesService - the console roles service. Aids in selecting, assigning and removing roles with the
   * roles table.
   * @param {object} $stateParams - the angular $stateParams service
   * @param {object} $q - the angular $q service
   * @param {object} $timeout - the angular $timeout service
   * @param {object} $uibModalInstance - the angular $uibModalInstance service used to close/dismiss a modal
   */
  function ManageUsersFactory($q, modelManager, asyncTaskDialog, rolesService) {

    var organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
    var spaceModel = modelManager.retrieve('cloud-foundry.model.space');

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
     * @description ???
     * @param {object} user ????
     * @returns {promise} ??
     */
    this.show = function (clusterGuid, users, refreshOrgRoles, refreshSpaceRoles) {

      selectedRoles = {};
      var organizations = organizationModel.organizations[clusterGuid];

      _.forEach(organizations, function (organization) {
        selectedRoles[organization.details.org.metadata.guid] = {};
        originalSelectedRoles[organization.details.org.metadata.guid] = {};
      });

      var state = {};
      var initPromise = rolesService.refreshRoles(clusterGuid, refreshOrgRoles, refreshSpaceRoles)
        .then(function () {
          state.initialised = true;
        })
        .catch(function () {
          state.initialised = false;
        });

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
