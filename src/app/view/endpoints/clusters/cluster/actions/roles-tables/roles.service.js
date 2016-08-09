(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster')
    .factory('app.view.endpoints.clusters.cluster.rolesService', RolesService);

  RolesService.$inject = [
    '$log',
    '$q',
    'app.model.modelManager',
    'app.event.eventService',
    'helion.framework.widgets.dialog.confirm'
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
   * @param {helion.framework.widgets.dialog.confirm} confirmDialog - the framework confirm dialog service
   * @property {boolean} changingRoles - True if roles are currently being changed and cache updated
   * @property {object} organizationRoles - Lists org roles and their translations
   * @property {object} spaceRoles - Lists space roles and their translations
   * @property {function} removeOrgRole - Remove user from a specific organization role
   * @property {function} removeSpaceRole - Remove user from a specific space role
   * @property {function} removeAllRoles - Remove users from all organizations and spaces in a cluster
   * @property {function} removeFromOrganization - Remove users from an organization and it's spaces
   * @property {function} removeFromSpace - Remove users from a space
   * @property {function} refreshRoles - Conditionally refresh the space roles cache
   * @property {function} assignUsers - Assign organization and space roles for the users supplied. does not cover
   * removing roles.
   * @property {function} updateUsers - Update (assign or remove) organization and space roles for the users supplied
   * @property {function} clearOrg - Clear the organisation + space roles of the organization provided
   * @property {function} clearOrgs - Clear all organisation and their space roles from the selection provided
   * @property {function} orgContainsRoles - Determine if the organisation provided and it's spaces has any roles
   * selected
   */
  function RolesService($log, $q, modelManager, eventService, confirmDialog) {
    var that = this;

    var organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
    var spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    var usersModel = modelManager.retrieve('cloud-foundry.model.users');

    this.changingRoles = false;

    // Some helper functions which list all org/space roles and also links them to their labels translations.
    this.organizationRoles = {
      org_manager: gettext('Org ') + organizationModel.organizationRoleToString('org_manager'),
      org_auditor: gettext('Org ') + organizationModel.organizationRoleToString('org_auditor'),
      billing_manager: organizationModel.organizationRoleToString('billing_manager'),
      org_user: gettext('Org ') + organizationModel.organizationRoleToString('org_user')
    };
    this.spaceRoles = {
      space_manager: gettext('Space ') + spaceModel.spaceRoleToString('space_manager'),
      space_auditor: gettext('Space ') + spaceModel.spaceRoleToString('space_auditor'),
      space_developer: gettext('Space ') + spaceModel.spaceRoleToString('space_developer'),
      org_user_filler: ''
    };

    // Helper function to link org/space operation to a function
    var rolesToFunctions = {
      org: {
        add: {
          org_manager: _.bind(usersModel.associateManagedOrganizationWithUser, usersModel),
          org_auditor: _.bind(usersModel.associateAuditedOrganizationWithUser, usersModel),
          billing_manager: _.bind(usersModel.associateBillingManagedOrganizationWithUser, usersModel),
          org_user: _.bind(usersModel.associateOrganizationWithUser, usersModel)

        },
        remove: {
          org_manager: _.bind(usersModel.removeManagedOrganizationFromUser, usersModel),
          org_auditor: _.bind(usersModel.removeAuditedOrganizationFromUser, usersModel),
          billing_manager: _.bind(usersModel.removeBillingManagedOrganizationFromUser, usersModel),
          org_user: _.bind(usersModel.removeOrganizationFromUser, usersModel)
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

    this.canRemoveOrgRole = function (role, orgRoles) {
      var hasOtherRoles = _.find(orgRoles, function (role) {
        return role !== 'org_user';
      });
      return role === 'org_user' ? !hasOtherRoles : true;
    };

    /**
     * @name app.view.endpoints.clusters.cluster.rolesService.removeOrgRole
     * @description Remove user from a specific organization role
     * @param {string} clusterGuid - HCF service guid
     * @param {string} orgGuid - the organizations guid
     * @param {object} user - HCF user object for the user whose role will be removed
     * @param {string} orgRole - the organisation role to be removed from, for example org_manager
     * @returns {promise} Resolved if changes occurred, Rejected if no changes or failure
     */
    this.removeOrgRole = function (clusterGuid, orgGuid, user, orgRole) {
      if (_.indexOf(_.keys(this.organizationRoles), orgRole) < 0) {
        return $q.reject('Cannot remove unknown role: ', orgRole);
      }
      var path = user.metadata.guid + '.' + orgGuid + '.organization.' + orgRole;
      var oldRolesByUser = _.set({}, path, true);
      var newRolesByUser = _.set({}, path, false);

      /* eslint-disable no-warning-comments */
      // TODO: TEAMFOUR-906: Endpoint Dashboard: Show list of changed roles per user in change role warning modal
      /* eslint-enable no-warning-comments */
      var confirmationConfig = {
        description: gettext('Are you sure you want to remove the following user\'s role? ') +
        user.entity.username + gettext(' from ') + that.organizationRoles[orgRole]
      };

      return updateUsersOrgsAndSpaces(clusterGuid, [user], oldRolesByUser, newRolesByUser,
        removeConfirmationConfig([user], confirmationConfig));
    };

    /**
     * @name app.view.endpoints.clusters.cluster.rolesService.removeSpaceRole
     * @description Remove user from a specific space role
     * @param {string} clusterGuid - HCF service guid
     * @param {string} orgGuid - the organizations guid
     * @param {string} spaceGuid - the space guid
     * @param {object} user - HCF user object for the user whose role will be removed
     * @param {string} spaceRole - the space role to be removed from, for example space_developer
     * @returns {promise} Resolved if changes occurred, Rejected if no changes or failure
     */
    this.removeSpaceRole = function (clusterGuid, orgGuid, spaceGuid, user, spaceRole) {
      if (!_.indexOf(_.keys(this.spaceRoles), spaceRole) < 0) {
        return $q.reject('Cannot remove unknown role: ', spaceRole);
      }
      var path = user.metadata.guid + '.' + orgGuid + '.spaces.' + spaceGuid + '.' + spaceRole;
      var oldRolesByUser = _.set({}, path, true);
      var newRolesByUser = _.set({}, path, false);

      /* eslint-disable no-warning-comments */
      // TODO: TEAMFOUR-906: Endpoint Dashboard: Show list of changed roles per user in change role warning modal
      /* eslint-enable no-warning-comments */
      var confirmationConfig = {
        description: gettext('Are you sure you want to remove the following user\'s role? ') +
        that.spaceRoles[spaceRole] + gettext(' from ') + user.entity.username
      };

      return updateUsersOrgsAndSpaces(clusterGuid, [user], oldRolesByUser, newRolesByUser,
        removeConfirmationConfig([user], confirmationConfig));
    };

    /**
     * @name app.view.endpoints.clusters.cluster.rolesService.removeAllRoles
     * @description Remove users from all organizations and spaces in a cluster
     * @param {string} clusterGuid - HCF service guid
     * @param {Array} users - Array of HCF user objects to be removed from the space
     * @returns {promise} Resolved if changes occurred, Rejected if no changes or failure
     */
    this.removeAllRoles = function (clusterGuid, users) {
      return this.refreshRoles(users, clusterGuid, true).then(function () {
        var oldRolesByUser = createCurrentRoles(users, clusterGuid);

        // Need to create a 'newRolesByUser' struct just like oldRolesByUser except flips any org/space role 'truthy' to
        // 'falsy'.
        var newRolesByUser = _.cloneDeep(oldRolesByUser);
        _.forEach(newRolesByUser, function (userRoles) {
          that.clearOrgs(userRoles);
        });

        return updateUsersOrgsAndSpaces(clusterGuid, users, oldRolesByUser, newRolesByUser,
          removeConfirmationConfig(users));
      });
    };

    /**
     * @name app.view.endpoints.clusters.cluster.rolesService.removeFromOrganization
     * @description Remove users from an organization and it's spaces
     * @param {string} clusterGuid - HCF service guid
     * @param {string} orgGuid - the organizations guid
     * @param {Array} users - Array of HCF user objects to be removed from the space
     * @returns {promise} Resolved if changes occurred, Rejected if no changes or failure
     */
    this.removeFromOrganization = function (clusterGuid, orgGuid, users) {
      return this.refreshRoles(users, clusterGuid, true).then(function () {
        var oldRolesByUser = createCurrentRoles(users, clusterGuid, orgGuid);

        // Need to create a 'newRolesByUser' struct just like oldRolesByUser except flips any org/space role 'truthy' to
        // 'falsy'.
        var newRolesByUser = _.cloneDeep(oldRolesByUser);
        _.forEach(newRolesByUser, function (userRoles) {
          that.clearOrgs(userRoles);
        });

        return updateUsersOrgsAndSpaces(clusterGuid, users, oldRolesByUser, newRolesByUser,
          removeConfirmationConfig(users));
      });
    };

    /**
     * @name app.view.endpoints.clusters.cluster.rolesService.removeFromSpace
     * @description Remove users from a space
     * @param {string} clusterGuid - HCF service guid
     * @param {string} orgGuid - the organizations guid
     * @param {string} spaceGuid - the space guid
     * @param {Array} users - Array of HCF user objects to be removed from the space
     * @returns {promise} Resolved if changes occurred, Rejected if no changes or failure
     */
    this.removeFromSpace = function (clusterGuid, orgGuid, spaceGuid, users) {
      var oldRolesByUser = createCurrentRoles(users, clusterGuid, orgGuid, spaceGuid);

      // Create a new struct that flips any 'truthy' space role to false
      var newRolesByUser = _.cloneDeep(oldRolesByUser);
      _.forEach(newRolesByUser, function (userRoles) {
        _.forEach(userRoles, function (org) {
          _.forEach(org.spaces, function (space) {
            clearRoleArray(space);
          });
        });
      });

      return updateUsersOrgsAndSpaces(clusterGuid, users, oldRolesByUser, newRolesByUser,
        removeConfirmationConfig(users));

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
     * @name app.view.endpoints.clusters.cluster.rolesService.assignUsers
     * @description Assign organization and space roles for the users supplied. does not cover
     * removing roles. If successful refresh the cache of the affected organizations and spaces
     * @param {string} clusterGuid - HCF service guid
     * @param {object} selectedUsers - collection of users to apply roles to
     * @param {object} newRoles - Object containing the new roles to apply. The diff of this and oldRoles will be
     * applied (assign/remove). Format is...
     *  Organizations... [orgGuid].organization[roleKey] = truthy
     *  Spaces...        [orgGuid].spaces[spaceGuid][roleKey] = truthy
     * @returns {promise} Resolved if changes occurred, Rejected if no changes or failure
     */
    this.assignUsers = function (clusterGuid, selectedUsers, newRoles) {

      // updateUsersOrgsAndSpaces expects a collection of previously selected roles. The diff of which
      // will be used to determine which assign or remove call to make to HCF.
      // For the assign users case we only want to make assign calls. So we need to make an oldRoles which is an
      // identical copy of the newRoles and reverse all 'true' to 'false'
      // Note - This ignores the users currently assigned roles, so there's a chance surplus requests are made

      var oldRoles = angular.fromJson(angular.toJson(newRoles));

      function flopTrueToFalse(obj) {
        _.forEach(obj, function (val, key) {
          if (val === true) {
            obj[key] = false;
          }
        });
      }

      _.forEach(oldRoles, function (oldRole) {
        flopTrueToFalse(oldRole.organization);
        _.forEach(oldRole.spaces, function (space) {
          flopTrueToFalse(space);
        });
      });

      // We require the roles per user, so create the required structs
      var oldRolesByUser = createRolesByUserObj(selectedUsers, oldRoles);
      var newRolesByUser = createRolesByUserObj(selectedUsers, newRoles);

      return updateUsersOrgsAndSpaces(clusterGuid, selectedUsers, oldRolesByUser, newRolesByUser,
        assignConfirmationConfig(selectedUsers));
    };

    /**
     * @name app.view.endpoints.clusters.cluster.rolesService.updateUsers
     * @description Update (assign or remove) organization and space roles for the users supplied
     * @param {string} clusterGuid - HCF service guid
     * @param {Array} selectedUsers - collection of users to apply roles to
     * @param {object} newRoles - Object containing the new roles to apply. The diff of this and oldRoles will be
     * applied (assign/remove). Format is...
     *  Organizations... [orgGuid].organization[roleKey] = truthy
     *  Spaces...        [orgGuid].spaces[spaceGuid][roleKey] = truthy
     * @returns {promise} Resolved if changes occurred, Rejected if no changes or failure
     */
    this.updateUsers = function (clusterGuid, selectedUsers, newRoles) {
      var oldRolesByUser = createCurrentRoles(selectedUsers, clusterGuid);
      var newRolesByUser = createRolesByUserObj(selectedUsers, newRoles);

      return updateUsersOrgsAndSpaces(clusterGuid, selectedUsers, oldRolesByUser, newRolesByUser,
        updateConfirmationConfig(selectedUsers));
    };

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
     * @name app.view.endpoints.clusters.cluster.rolesService.clearOrgs
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
     * @name app.view.endpoints.clusters.cluster.rolesService.orgContainsRoles
     * @description Determine if the organisation provided and it's spaces has any roles selected
     * @param {object} org - organization to clear. Format as below.
     *  organization[roleKey] = truthy
     *  spaces[spaceGuid][roleKey] = truthy
     * @returns {boolean}
     */
    this.orgContainsRoles = function (org) {
      var orgContainsRoles = _.find(org.organization, function (role) {
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

    this.updateOrgUser = function (orgRoles) {
      if (!orgRoles) {
        return;
      }
      for (var role in orgRoles) {
        if (!orgRoles.hasOwnProperty(role)) {
          continue;
        }
        if (role === 'org_user') {
          continue;
        }
        if (orgRoles[role]) {
          // Org has role other than org_user, so it MUST also have org_user
          orgRoles.org_user = true;
          return;
        }
      }
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
     * @name createCurrentRoles
     * @description Determines the org and space roles for the users provided
     * @param {Array} users - array of HCF user objects
     * @param {string} clusterGuid - console service guid for cluster
     * @param {string=} singleOrgGuid - restrict result to a single org
     * @param {string=} singleSpaceGuid - restrict result to a single space
     * @returns {object} Structure is...
     * [userGuid][orgGuid].organization[roleKey] = truthy
     * [userGuid][orgGuid].spaces[spaceGuid][roleKey] = truthy
     */
    function createCurrentRoles(users, clusterGuid, singleOrgGuid, singleSpaceGuid) {
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
          var spaceGuid = space.metadata.guid;
          space = _.get(spaceModel, 'spaces.' + clusterGuid + '.' + spaceGuid, {});
          _.forEach(space.roles, function (roles, userGuid) {
            if (!singleSpaceGuid || singleSpaceGuid === spaceGuid) {

              if (_.find(users, { metadata: { guid: userGuid }})) {
                _.set(rolesByUser, userGuid + '.' + orgGuid + '.spaces.' + spaceGuid, _.keyBy(roles));
              }
            }
          });
        });
      });
      return rolesByUser;
    }

    function createRolesByUserObj(users, roles) {
      var newRolesByUser = {};
      _.forEach(users, function (user) {
        newRolesByUser[user.metadata.guid] = roles;
      });
      return newRolesByUser;
    }

    function removeConfirmationConfig(users, config) {
      /* eslint-disable no-warning-comments */
      // TODO: TEAMFOUR-906: Endpoint Dashboard: Show list of changed roles per user in change role warning modal
      /* eslint-enable no-warning-comments */
      var usernames = _.map(users, 'entity.username');
      return _.assign({
        title: usernames.length > 1 ? gettext('Remove Users') : gettext('Remove User'),
        description: usernames.length > 1
          ? gettext('Are you sure you want to remove role/s for the following users? ') + usernames.join(', ')
          : gettext('Are you sure you want to remove role/s for the following user? ') + usernames.join(', '),
        buttonText: {
          yes: gettext('Remove')
        }
      }, config);

    }

    function assignConfirmationConfig(users, config) {
      /* eslint-disable no-warning-comments */
      // TODO: TEAMFOUR-906: Endpoint Dashboard: Show list of changed roles per user in change role warning modal
      /* eslint-enable no-warning-comments */
      var usernames = _.map(users, 'entity.username');
      return _.assign({
        title: usernames.length > 1 ? gettext('Assign Users') : gettext('Assign User'),
        description: usernames.length > 1
          ? gettext('Are you sure you want to assign role/s for the following users? ') + usernames.join(', ')
          : gettext('Are you sure you want to assign role/s for the following user? ') + usernames.join(', '),
        buttonText: {
          yes: gettext('Assign')
        }
      }, config);
    }

    function updateConfirmationConfig(users, config) {
      /* eslint-disable no-warning-comments */
      // TODO: TEAMFOUR-906: Endpoint Dashboard: Show list of changed roles per user in change role warning modal
      /* eslint-enable no-warning-comments */
      var usernames = _.map(users, 'entity.username');
      return _.assign({
        title: usernames.length > 1 ? gettext('Update Users') : gettext('Update User'),
        description: usernames.length > 1
          ? gettext('Are you sure you want to update role/s for the following users? ') + usernames.join(', ')
          : gettext('Are you sure you want to update role/s for the following user? ') + usernames.join(', '),
        buttonText: {
          yes: gettext('Update')
        }
      }, config);
    }

    /**
     * @name app.view.endpoints.clusters.cluster.rolesService.updateUsersOrgsAndSpaces
     * @description Assign the controllers selected users with the selected roles. If successful refresh the cache of
     * the affected organizations and spaces.
     * IMPORTANT!!! This is the conduit for changes that all external calls should flow through. It gates the process
     * on a confirmation model and also handles the global 'changingRoles' flag.
     * @param {string} clusterGuid - HCF service guid
     * @param {object} selectedUsers - collection of users to apply roles to
     * @param {object} oldRolesByUser - Object containing the previously selected roles, or the initial state. The diff
     * between this and newRoles will be applied (assign/remove). Format matches newRoles.
     *  Organizations... [userGuid][orgGuid].organization[roleKey] = truthy
     *  Spaces...        [userGuid][orgGuid].spaces[spaceGuid][roleKey] = truthy
     * @param {object} newRolesByUser - Object containing the new roles to apply. The delta of this and oldRoles will be
     * applied (assign/remove). Format matches oldRoles
     * @param {string=} overrideConfConfig - Override the default confirmation dialog config
     * @returns {promise}
     */
    function updateUsersOrgsAndSpaces(clusterGuid, selectedUsers, oldRolesByUser, newRolesByUser, overrideConfConfig) {
      that.changingRoles = true;

      var defaultConfirmationDialogConfig = {
        title: gettext('Change Roles'),
        description: gettext('Are you sure you want to change user roles?'),
        buttonText: {
          yes: gettext('Change'),
          no: gettext('Cancel')
        },
        callback: function () {
          var failedAssignForUsers = [];

          // For each user assign their new roles. Do this asynchronously
          var promises = [];
          _.forEach(selectedUsers, function (user) {
            var promise = updateUserOrgsAndSpaces(clusterGuid, user, oldRolesByUser[user.metadata.guid],
              newRolesByUser[user.metadata.guid])
              .catch(function (error) {
                // Swallow promise chain error and track by number of failed users
                failedAssignForUsers.push(user.entity.username);
                $log.error('Failed to update user ' + user.entity.username, error);
              });
            promises.push(promise);
          });

          // If all async requests have finished invalidate any cache associated with roles
          return $q.all(promises).then(function () {
            eventService.$emit(eventService.events.ROLES_UPDATED);
            if (failedAssignForUsers.length > 0) {
              return $q.reject(gettext('Failed to update user(s) ') + failedAssignForUsers.join(','));
            }
          });
        }
      };

      return confirmDialog(_.assign(defaultConfirmationDialogConfig, overrideConfConfig)).result
        .finally(function () {
          that.changingRoles = false;
        });
    }

    function updateUserOrgsAndSpaces(clusterGuid, user, oldRolesPerOrg, newRolesPerOrg) {
      var promises = [];

      _.forEach(newRolesPerOrg, function (orgRoles, orgGuid) {
        promises.push(updateUserOrgAndSpaces(clusterGuid, user, orgGuid, _.get(oldRolesPerOrg, orgGuid), orgRoles));
      });

      return $q.all(promises);
    }

    function updateUserOrgAndSpaces(clusterGuid, user, orgGuid, oldOrgRoles, newOrgRoles) {
      var userGuid = user.metadata.guid;

      // Track which orgs and spaces were affected. We'll update the cache for these afterwards
      var changes = {
        organization: false,
        spaces: {}
      };

      // Need to ensure that we execute organization role changes in a specific order
      // If we're ADDING non-org_user roles we need to first ensure that we complete the add for org_user
      // If we're REMOVING org_user we need to first ensure that we complete the remove of non-org_user roles

      function createOrgRoleRequests(roles) {
        var orgPromises = [];
        // Assign/Remove Organization Roles
        _.forEach(roles, function (selected, roleKey) {
          // Has there been a change in the org role?
          var oldRoleSelected = _.get(oldOrgRoles, 'organization.' + roleKey) || false;
          if (!!oldRoleSelected === !!selected) {
            return;
          }

          // We're either assigning a new role or removing an old role....
          if (selected) {
            // ... Assign role.
            orgPromises.push(rolesToFunctions.org.add[roleKey](clusterGuid, orgGuid, userGuid));
          } else {
            // ... Remove role.
            orgPromises.push(rolesToFunctions.org.remove[roleKey](clusterGuid, orgGuid, userGuid));
          }
          changes.organization = true;
        });
        return $q.all(orgPromises);
      }

      // preReqPromise will either be a promise that's resolved once the org_user has updated or all non-org_user rolls
      // have changed.
      var preReqPromise = $q.when();
      // Clone the new org roles. This will be the 'to do' list of changes that are executed after preReqPromise.
      var orgRoles = _.clone(newOrgRoles.organization);
      // Understand what the old org_user value was which will be compared to the new org_user value;
      var newOrgUser = _.get(orgRoles, 'org_user') || false;
      var oldOrgUser = _.get(oldOrgRoles, 'organization.org_user') || false;

      // Has it changed?
      if (!!oldOrgUser !== !!newOrgUser) {
        delete orgRoles.org_user;

        if (newOrgUser) {
          // We're ADDING the org_user, ensure this occurs BEFORE any other change/s
          preReqPromise = rolesToFunctions.org.add.org_user(clusterGuid, orgGuid, userGuid);
        } else {
          // We're REMOVING the org_user, ensure this occurs AFTER any other change/s
          preReqPromise = createOrgRoleRequests(orgRoles);
          orgRoles = {
            org_user: false
          };
        }
        // By this stage the orgRoles object should contain a set of changes to make after the initial promise is
        // resolved.
        // Track that we've made changes to this org.
        changes.organization = true;
      }

      return preReqPromise
        .then(function () {
          return createOrgRoleRequests(orgRoles);
        })
        .then(function () {
          // All organization changes have been made. Continue to space changes
          var updatePromises = [];

          // Assign/Remove Spaces Roles
          _.forEach(newOrgRoles.spaces, function (spaceRoles, spaceGuid) {

            _.forEach(spaceRoles, function (selected, roleKey) {
              // Has there been a change in the space role?
              var oldRoleSelected = _.get(oldOrgRoles, 'spaces.' + spaceGuid + '.' + roleKey) || false;
              if (oldRoleSelected === selected) {
                return;
              }

              // Track changes
              changes.spaces[spaceGuid] = true;

              if (selected) {
                // Assign role
                updatePromises.push(rolesToFunctions.space.add[roleKey](clusterGuid, spaceGuid, userGuid));
              } else {
                // Remove role
                updatePromises.push(rolesToFunctions.space.remove[roleKey](clusterGuid, spaceGuid, userGuid));
              }

            });
          });
          return $q.all(updatePromises);
        })
        .then(function () {
          // All changes have been made, refresh the local cache of all affected orgs/spaces
          var cachePromises = [];
          // Refresh org cache
          if (changes.organization) {
            var org = _.get(organizationModel, organizationModel.fetchOrganizationPath(clusterGuid, orgGuid));
            cachePromises.push(organizationModel.getOrganizationDetails(clusterGuid, org.details.org));
          }

          // Refresh space caches
          _.forEach(changes.spaces, function (changed, spaceGuid) {
            cachePromises.push(spaceModel.listRolesOfAllUsersInSpace(clusterGuid, spaceGuid));
          });

          return $q.all(cachePromises);
        });

    }

    return this;
  }

})();
