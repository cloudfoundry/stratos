(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster')
    .factory('app.view.endpoints.clusters.cluster.manangeUsers', ManageUsersFactory);

  ManageUsersFactory.$inject = [
    '$q',
    'app.model.modelManager',
    'helion.framework.widgets.asyncTaskDialog',
    '$stateParams',
    '$rootScope'
  ];

  function ManageUsersFactory($q, modelManager, asyncTaskDialog, $stateParams, $rootScope) {
    var that = this;

    var organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
    var spaceModel = modelManager.retrieve('cloud-foundry.model.space');

    var orgRoles = {};
    _.forEach(['org_manager', 'org_auditor', 'billing_manager'], function (role) {
      orgRoles[role] = organizationModel.organizationRoleToString(role);
    });
    var spaceRoles = {};
    _.forEach(['space_manager', 'space_auditor', 'space_developer'], function (role) {
      spaceRoles[role] = spaceModel.spaceRoleToString(role);
    });

    var selectedRoles = {};

    /**
     * @name ManageUsersFactory.show
     * @description ???
     * @param {object} user ????
     * @returns {promise} ??
     */
    this.show = function (clusterGuid, users, refreshOrgRoles, refreshSpaceRoles) {

      selectedRoles = {};

      var initPromises = [];
      if (refreshOrgRoles || refreshSpaceRoles) {
        _.forEach(organizationModel.organizations[clusterGuid], function(organization) {
          selectedRoles[organization.details.org.metadata.guid] = {};

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

      return asyncTaskDialog(
        {
          title: users.length === 1 ? gettext('Manager User: ') + users[0].entity.username : 'TEAMFOUR-708',
          templateUrl: 'app/view/endpoints/clusters/cluster/actions/manage-user/manage-user.html',
          buttonTitles: {
            submit: gettext('Save Changes')
          }
        },
        {
          removeFromOrg: that.removeFromOrg,
          data: {
            organizations: organizationModel.organizations[clusterGuid]
          },
          selectedRoles: selectedRoles,
          tableConfig: {
            clusterGuid: clusterGuid,
            orgRoles: orgRoles,
            spaceRoles: spaceRoles,
            users: users,
            initPromise: initPromise
          },
          state: state
        },
        that.assignUsers
      );
    };

    this.removeFromOrg = function (arg) {
      console.log('removeFromOrg: ', arg);
    };

    /**
     * @name ManageUsersFactory.assignUsers
     * @description Assign the controllers selected users with the selected roles. If successful refresh the cache of
     * the affected organizations and spaces
     * @returns {promise}
     */
    this.assignUsers = function () {
      console.log('selectedRoles: ', selectedRoles);
      return $q.reject('poop butt');
    };

    /**
     * @name ManageUsersFactory.assignUser
     * @description Assign the user's selected roles. If successful refresh the cache of the affected organizations and
     * spaces
     * @param {object} user - the HCF user object of the user to assign roles to
     * @returns {promise}
     */
    this.assignUser = function (user) {

    };

    return this;
  }


})();
