(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster')
    .factory('app.view.endpoints.clusters.cluster.manageUsers', ManageUsersFactory);

  ManageUsersFactory.$inject = [
    '$q',
    'app.model.modelManager',
    'helion.framework.widgets.asyncTaskDialog',
    '$stateParams',
    '$rootScope',
    'app.view.endpoints.clusters.cluster.rolesService'
  ];

  function ManageUsersFactory($q, modelManager, asyncTaskDialog, $stateParams, $rootScope, rolesService) {
    // var that = this;

    var organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
    var spaceModel = modelManager.retrieve('cloud-foundry.model.space');

    var selectedRoles = {};
    var originalSelectedRoles = {};

    var removeFromOrg = function (orgGuid) {
      selectedRoles[orgGuid].organization = {};
      _.forEach(selectedRoles[orgGuid].spaces, function (space, key) {
        selectedRoles[orgGuid].spaces[key] = {};
      });
    };

    var containsRoles = function (orgGuid) {
      var orgContainsRoles = _.find(selectedRoles[orgGuid].organization, function (role, key) {
        if (key === 'org_user') {
          return false;
        }
        return role;
      });
      if (orgContainsRoles) {
        return true;
      }

      var spaces = selectedRoles[orgGuid].spaces;
      if (!spaces) {
        return false;
      }
      for (var spaceGuid in spaces) {
        if (!spaces.hasOwnProperty(spaceGuid)) {
          continue;
        }
        if (_.find(spaces[spaceGuid])) {
          return true;
        }
      }
      return false;
    };


    /**
     * @name ManageUsersFactory.show
     * @description ???
     * @param {object} user ????
     * @returns {promise} ??
     */
    this.show = function (clusterGuid, users, refreshOrgRoles, refreshSpaceRoles) {

      selectedRoles = {};
      var organization = organizationModel.organizations[clusterGuid];

      var initPromises = [];
      if (refreshOrgRoles || refreshSpaceRoles) {
        _.forEach(organization, function(organization) {
          selectedRoles[organization.details.org.metadata.guid] = {};
          originalSelectedRoles[organization.details.org.metadata.guid] = {};


          if (refreshOrgRoles) {
            //TODO:
          }

          if (refreshSpaceRoles) {
            _.forEach(organization.spaces, function (space) {
              initPromises.push(spaceModel.listRolesOfAllUsersInSpace(clusterGuid, space.metadata.guid));
            });
          }
        });
      }

      var state = {};
      var initPromise = $q.all(initPromises)
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
            organizations: organization
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
            containsRoles: containsRoles
          },
          state: state
        },
        updateUsers
      );
    };

    return this;
  }


})();
