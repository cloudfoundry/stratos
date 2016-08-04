(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster')
    .factory('app.view.endpoints.clusters.cluster.rolesService', RolesService);

  RolesService.$inject = [
    '$log',
    '$q',
    'app.model.modelManager',
    'app.event.eventService'
  ];

  /**
   * @name RolesService
   * @description Service to handle the data required/created by roles tables. This includes the ability to reach out
   * and update HCF roles. Covers functionality used by Assign/Manage/Change users slide outs and Users tables.
   * @constructor
   * @param {object} $log - the angular $log service
   * @param {object} $q - the angular $q service
   * @param {app.model.modelManager} modelManager - the model management service
   * @param {app.event.eventService} eventService - the event bus service
   * @property {object} organizationRoles - Lists org roles and their translations
   * @property {object} spaceRoles - Lists space roles and their translations
   * @property {function} refreshRoles - Conditionally refresh the space roles cache
   * @property {function} updateUsers - Update the organization and space roles for the users supplied
   * @property {function} clearOrg - Clear the organisation + space roles of the organization provided
   * @property {function} clearOrgs - Clear all organisation and their space roles from the selection provided
   * @property {function} orgContainsRoles - Determine if the organisation provided and it's spaces has any roles
   * selected
   */
  function RolesService($log, $q, modelManager, eventService) {
    var that = this;

    var organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
    var spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    var usersModel = modelManager.retrieve('cloud-foundry.model.users');

    // Some helper functions which list all org/space roles and also links them to their labels translations.
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

    // Helper function to link org/space operation to a function
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

    this.removeOrgRole = function (clusterGuid, orgGuid, user, orgRole) {
      if (_.indexOf(_.keys(this.organizationRoles), orgRole) < 0) {
        return $q.reject('Cannot remove unknown role: ', orgRole);
      }
      var origRoles = _.set({}, orgGuid + '.organization.' + orgRole, true);
      var newRoles = _.set({}, orgGuid + '.organization.' + orgRole, false);
      return this.updateUsers(clusterGuid, [user], origRoles, newRoles);
    };

    this.removeSpaceRole = function (clusterGuid, orgGuid, spaceGuid, user, spaceRole) {
      if (!_.indexOf(_.keys(this.spaceRoles), spaceRole) < 0) {
        return $q.reject('Cannot remove unknown role: ', spaceRole);
      }
      var origRoles = _.set({}, orgGuid + '.spaces.' + spaceGuid + '.' + spaceRole, true);
      var newRoles = _.set({}, orgGuid + '.spaces.' + spaceGuid + '.' + spaceRole, false);
      return this.updateUsers(clusterGuid, [user], origRoles, newRoles);
    };

    function createCurrentRoles(users, clusterGuid, singleOrgGuid, singleSpaceGuid) {
      // [user][orgGuid].organization[roleKey] = truthy
      // [user][orgGuid].spaces[spaceGuid][roleKey] = truthy
      var rolesByUser = {};
      _.forEach(organizationModel.organizations[clusterGuid], function (org, orgGuid) {
        if (!singleOrgGuid || singleOrgGuid === orgGuid) {
          _.forEach(org.roles, function (roles, userGuid) {
            if (_.find(users, { metadata: { guid: userGuid }})) {
              _.set(rolesByUser, userGuid + '.' + orgGuid + '.organization', _.keyBy(roles));
            }
          });
        }

        _.forEach(org.spaces, function (space) {
          space = _.get(spaceModel, 'spaces.' + clusterGuid + '.' + space.metadata.guid, {});
          _.forEach(space.roles, function (roles, userGuid) {
            if (!singleSpaceGuid || singleSpaceGuid === space.details.space.metadata.guid) {

              if (_.find(users, { metadata: { guid: userGuid }})) {
                _.set(rolesByUser, userGuid + '.' + orgGuid + '.spaces.' + space.details.space.metadata.guid, _.keyBy(roles));
              }
            }
          });
        });
      });
      return rolesByUser;
    }

    this.removeAllRoles = function (clusterGuid, users) {
      return this.refreshRoles(users, clusterGuid, true).then(function () {
        var rolesByUser = createCurrentRoles(users, clusterGuid);

        // TODO: RC See TEAMFOUR-708. At the moment we only cater for one user
        var roles = rolesByUser[users[0].metadata.guid];

        var newRoles = _.cloneDeep(roles, true);
        that.clearOrgs(newRoles);

        return that.updateUsers(clusterGuid, [ users[0] ], roles, newRoles);
      });
    };

    this.removeFromOrganization = function (clusterGuid, orgGuid, users) {
      return this.refreshRoles(users, clusterGuid, true).then(function () {
        var rolesByUser = createCurrentRoles(users, clusterGuid, orgGuid);

        // TODO: RC See TEAMFOUR-708. At the moment we only cater for one user
        var roles = rolesByUser[users[0].metadata.guid];

        var newRoles = _.cloneDeep(roles, true);
        that.clearOrgs(newRoles);

        return that.updateUsers(clusterGuid, [ users[0] ], roles, newRoles);
      });
    };

    this.removeFromSpace = function (clusterGuid, orgGuid, spaceGuid, users) {
      var rolesByUser = createCurrentRoles(users, clusterGuid, orgGuid, spaceGuid);
      _.forEach(rolesByUser, function (userRoles) {
        _.forEach(userRoles, function (org) {
          org.organization = null;
        });
      });

      // TODO: RC See TEAMFOUR-708. At the moment we only cater for one user
      var roles = rolesByUser[users[0].metadata.guid];

      var newRoles = _.cloneDeep(roles, true);
      this.clearOrgs(newRoles);

      return this.updateUsers(clusterGuid, [ users[0] ], roles, newRoles);

    };

    /**
     * @name app.view.endpoints.clusters.cluster.rolesService.refreshRoles
     * @description Conditionally refresh the space roles cache
     * @param {string} clusterGuid - HCF service guid
     * @param {object} refreshSpaceRoles - True if the space roles cache should be updated
     * @returns {promise}
     */
    this.refreshRoles = function (clusterGuid, refreshSpaceRoles) {
      var initPromises = [];
      if (!refreshSpaceRoles) {
        return $q.when();
      }

      _.forEach(organizationModel.organizations[clusterGuid], function (organization) {
        _.forEach(organization.spaces, function (space) {
          initPromises.push(spaceModel.listRolesOfAllUsersInSpace(clusterGuid, space.metadata.guid));
        });
      });

      return $q.all(initPromises);
    };

    /**
     * @name app.view.endpoints.clusters.cluster.rolesService.updateUsers
     * @description Assign the controllers selected users with the selected roles. If successful refresh the cache of
     * the affected organizations and spaces
     * @param {string} clusterGuid - HCF service guid
     * @param {object} selectedUsers - collection of users to apply roles to
     * @param {object} oldRoles - Object containing the previously selected roles, or the initial state. The diff
     * between this and newRoles will be applied (assign/remove). Format must match newRoles.
     *  Organizations... [orgGuid].organization[roleKey] = truthy
     *  Spaces...        [orgGuid].spaces[spaceGuid][roleKey] = truthy
     * @param {object} newRoles - Object containing the new roles to apply. The diff of this and oldRoles will be
     * applied (assign/remove). Format must match oldRoles.
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
      return $q.all(promises).then(function () {
        eventService.$emit(eventService.events.ROLES_UPDATED);
      }).catch(function () {
        $log.error('Failed to update users: ', failedAssignForUsers.join('.'));
        throw failedAssignForUsers;
      });
    };

    function clearRoleArray(roleObject) {
      // Ensure that we flip any selected role. Do this instead of null/undefined/delete to ensure that the diff
      // between previous and current roles acts correctly (removed val from roles object would just be ignored and thus
      // not removed)
      _.forEach(roleObject, function (selected, roleKey) {
        if (selected) {
          roleObject[roleKey] = false;
        }
      });
    }

    /**
     * @name app.view.endpoints.clusters.cluster.rolesService.clearOrg
     * @description Clear the organisation + space roles of the organization provided
     * @param {object} org - organization to clear. Format as below.
     *  organization[roleKey] = truthy
     *  spaces[spaceGuid][roleKey] = truthy
     */
    this.clearOrg = function (org) {
      clearRoleArray(org.organization);
      _.forEach(org.spaces, function (space) {
        clearRoleArray(space);
      });
    };

    /**
     * @name app.view.endpoints.clusters.cluster.rolesService.clearOrg
     * @description clearOrgs Clear all organisation and their space roles from the selection provided
     * @param {object} orgs - object organization to clear. Format as below.
     *  [orgGuid]organization[roleKey] = truthy
     *  [orgGuid]spaces[spaceGuid][roleKey] = truthy
     */
    this.clearOrgs = function (orgs) {
      var that = this;
      _.forEach(orgs, function (org) {
        that.clearOrg(org);
      });
    };

    /**
     * @name app.view.endpoints.clusters.cluster.rolesService.updateUsers
     * @description Determine if the organisation provided and it's spaces has any roles selected
     * @param {object} org - organization to clear. Format as below.
     *  organization[roleKey] = truthy
     *  spaces[spaceGuid][roleKey] = truthy
     * @returns {boolean}
     */
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

    function updateUser(clusterGuid, user, oldRolesPerOrg, newRolesPerOrg) {
      var promises = [];

      _.forEach(newRolesPerOrg, function (orgRoles, orgGuid) {
        promises.push(updateRolesAndCache(clusterGuid, user, orgGuid, oldRolesPerOrg[orgGuid], orgRoles));
      });

      return $q.all(promises);
    }

    function updateRolesAndCache(clusterGuid, user, orgGuid, oldOrgRoles, newOrgRoles) {
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
        if (roleKey === 'org_user') {
          return;
        }

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
