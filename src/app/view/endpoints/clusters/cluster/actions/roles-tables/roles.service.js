(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster')
    .factory('app.view.endpoints.clusters.cluster.rolesService', RolesService);

  RolesService.$inject = [
    '$log',
    '$q',
    'app.model.modelManager'
  ];

  // Makes requests, refreshes caches
  // @params
  function RolesService($log, $q, modelManager) {

    var organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
    var spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    var usersModel = modelManager.retrieve('cloud-foundry.model.users');

    this.organizationRoles = {
      org_manager: organizationModel.organizationRoleToString('org_manager'),
      org_auditor: organizationModel.organizationRoleToString('org_auditor'),
      billing_manager: organizationModel.organizationRoleToString('billing_manager')
    };

    this.spaceRoles = {
      space_manager: spaceModel.spaceRoleToString('space_manager'),
      space_auditor: spaceModel.spaceRoleToString('space_auditor'),
      space_developer: spaceModel.spaceRoleToString('space_developer')
    };

    var rolesToFunctions = {
      org: {
        add: {
          org_manager: _.bind(usersModel.associateManagedOrganizationWithUser, usersModel),
          org_auditor: _.bind(usersModel.associateAuditedOrganizationWithUser, usersModel),
          billing_manager: _.bind(usersModel.associateBillingManagedOrganizationWithUser, usersModel)
        },
        remove: {
          org_manager: _.bind(usersModel.removeManagedOrganizationFromUser, usersModel),
          org_auditor: _.bind(usersModel.removeAuditedOrganizationFromUser, usersModel),
          billing_manager: _.bind(usersModel.removeBillingManagedOrganizationFromUser, usersModel)
        }
      },
      space: {
        add: {
          space_manager: _.bind(usersModel.associateManagedSpaceWithUser, usersModel),
          space_auditor: _.bind(usersModel.associateAuditedSpaceWithUser, usersModel),
          space_developer: _.bind(usersModel.associateSpaceWithUser, usersModel)
        },
        remove: {
          space_manager: _.bind(usersModel.removeManagedSpaceFromUser, usersModel),
          space_auditor: _.bind(usersModel.removeAuditedSpaceFromUser, usersModel),
          space_developer: _.bind(usersModel.removeSpaceFromUser, usersModel)
        }
      }
    };

    this.refreshRoles = function (clusterGuid, refreshOrgRoles, refreshSpaceRoles) {
      var initPromises = [];
      if (!refreshOrgRoles && !refreshSpaceRoles) {
        return $q.when();
      }

      _.forEach(organizationModel.organizations[clusterGuid], function(organization) {
        if (refreshOrgRoles) {
          //TODO:
        }

        if (refreshSpaceRoles) {
          _.forEach(organization.spaces, function(space) {
            initPromises.push(spaceModel.listRolesOfAllUsersInSpace(clusterGuid, space.metadata.guid));
          });
        }
      });
      return $q.all(initPromises);
    };

    /**
     * @name app.view.endpoints.clusters.cluster.rolesService.updateUsers
     * @description Assign the controllers selected users with the selected roles. If successful refresh the cache of
     * the affected organizations and spaces
     * @param {object} oldRoles - Object containing the previously selected roles, or the initial state.
     *  Organizations... [userGuid][orgGuid].organization[roleKey] = truthy
     *  Spaces...        [userGuid][orgGuid].spaces[spaceGuid][roleKey] = truthy
     * @returns {promise}
     */
    this.updateUsers = function (clusterGuid, selectedUsers, oldRoles, newRoles) {
      var failedAssignForUsers = [];

      // For each user assign their new roles. Do this asynchronously
      var promises = [];
      _.forEach(selectedUsers, function (user) {
        var promise = updateUser(clusterGuid, user, oldRoles, newRoles)
          .catch(function (error) {
            failedAssignForUsers.push(user.entity.username);
            throw error;
          });
        promises.push(promise);
      });

      // If all async requests have finished invalidate any cache associated with roles
      return $q.all(promises).catch(function () {
        $log.error('Failed to update users: ', failedAssignForUsers.join('.'));
        throw failedAssignForUsers;
      });
    };

    this.clearOrg = function (org) {
      org.organization = {};
      _.forEach(org.spaces, function (space, key) {
        org.spaces[key] = {};
      });
    };

    this.clearOrgs = function (orgs) {
      var that = this;
      _.forEach(orgs, function (org) {
        that.clearOrg(org);
      });
    };

    this.orgContainsRoles = function (org) {
      var orgContainsRoles = _.find(org.organization, function (role, key) {
        if (key === 'org_user') {
          return false;
        }
        return role;
      });
      if (orgContainsRoles) {
        return true;
      }

      var spaces = org.spaces;
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
     * @name ManageUsersFactory.updateUser
     * @description Assign the user's selected roles. If successful refresh the cache of the affected organizations and
     * spaces
     * @param {object} user - the HCF user object of the user to assign roles to
     * @returns {promise}
     */
    function updateUser(clusterGuid, user, oldRolesPerOrg, newRolesPerOrg) {
      var promises = [];

      _.forEach(newRolesPerOrg, function (orgRoles, orgGuid) {
        promises.push(updateOrgAndSpaces(clusterGuid, user, orgGuid, oldRolesPerOrg[orgGuid], orgRoles));
      });

      return $q.all(promises);
    }

    function updateOrgAndSpaces(clusterGuid, user, orgGuid, oldOrgRoles, newOrgRoles) {
      var userGuid = user.metadata.guid;

      // Track which orgs and spaces were affected. We'll update the cache for these afterwards
      var changes = {
        organization: false,
        spaces: []
      };

      var updatePromises = [];
      var associatedWithOrg = $q.when();

      // Assign/Remove Organization Roles
      _.forEach(newOrgRoles.organization, function (selected, roleKey) {
        // Has there been a change in the org role?
        var oldRoleSelected = _.get(oldOrgRoles, 'organization.' + roleKey);
        if (oldRoleSelected === selected) {
          return;
        }

        // We're either assigning a new role or removing an old role....
        if (selected) {
          // ... Assign role. First we need to ensure that they're associated
          if (!changes.organization) {
            associatedWithOrg = usersModel.associateOrganizationWithUser(clusterGuid, orgGuid, userGuid);
          }
          var assignPromise = associatedWithOrg.then(function () {
            return rolesToFunctions.org.add[roleKey](clusterGuid, orgGuid, userGuid);
          });
          updatePromises.push(assignPromise);
        } else {
          // ... Remove
          updatePromises.push(rolesToFunctions.org.remove[roleKey](clusterGuid, orgGuid, userGuid));
        }
        changes.organization = true;

      });

      // Assign/Remove Spaces Roles
      _.forEach(newOrgRoles.spaces, function (spaceRoles, spaceGuid) {

        _.forEach(spaceRoles, function (selected, roleKey) {
          // Has there been a change in the space role?
          var oldRoleSelected = _.get(oldOrgRoles, 'spaces.' + spaceGuid + '.' + roleKey);
          if (oldRoleSelected === selected) {
            return;
          }

          // Track changes
          if (_.findIndex(changes.spaces, spaceGuid) < 0) {
            changes.spaces.push(spaceGuid);
          }

          if (selected) {
            // Assign role
            updatePromises.push(rolesToFunctions.space.add[roleKey](clusterGuid, spaceGuid, userGuid));
          } else {
            // Remove role
            updatePromises.push(rolesToFunctions.space.remove[roleKey](clusterGuid, spaceGuid, userGuid));
          }

        });
      });

      return $q.all(updatePromises).then(function () {
        var cachePromises = [];
        // Refresh org cache
        if (changes.organization) {
          var org = _.get(organizationModel, organizationModel.fetchOrganizationPath(clusterGuid, orgGuid));
          cachePromises.push(organizationModel.getOrganizationDetails(clusterGuid, org.details.org));
        }

        // Refresh space caches
        if (changes.spaces && changes.spaces.length > 0) {
          _.forEach(changes.spaces, function (spaceGuid) {
            cachePromises.push(spaceModel.listRolesOfAllUsersInSpace(clusterGuid, spaceGuid));
          });
        }
        return $q.all(cachePromises);
      });

    }

    return this;
  }

})();
