(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model.AuthModel
   * @memberof cloud-foundry.model
   * @name AuthModel
   * @description CF ACL Model
   */
  angular
    .module('cloud-foundry.model')
    .run(register);

  function register(modelManager, $q) {
    modelManager.register('cloud-foundry.model.auth', new AuthModel(modelManager, $q));
  }

  /**
   * @name AuthModel
   * @param {object} modelManager - Model Manager
   * @param {object} $q - angular $q service
   * @constructor
   */
  function AuthModel(modelManager, $q) {

    var model = {
      // Initialised authorization checkers for individual CNSIs
      principal: {},
      resources: {
        space: 'space',
        user: 'user',
        space_quota_definition: 'space_quota_definition',
        user_provided_service_instance: 'user_provided_service_instance',
        managed_service_instance: 'managed_service_instance',
        service_instance: 'service_instance',
        organization: 'organization',
        application: 'application',
        domain: 'domain',
        route: 'route'
      },
      actions: {
        create: 'create',
        update: 'update',
        delete: 'delete',
        rename: 'rename'
      },
      roles: {
        space_developer: 'space_developer'
      },
      initialize: initialize,
      initializeForEndpoint: initializeForEndpoint,
      isAllowed: isAllowed,
      isInitialized: isInitialized,
      remove: remove,
      doesUserHaveRole: doesUserHaveRole,
      isOrgOrSpaceActionableByResource: isOrgOrSpaceActionableByResource,
      isAdmin: isAdmin
    };

    return model;

    /**
     * @name initialize
     * @description Initialize AuthModel for all connected endpoints
     * @returns {promise} Initialization promise
     */
    function initialize() {
      // Initialise Auth Service

      var authModelInitPromise = [];
      var userCnsiModel = modelManager.retrieve('app.model.serviceInstance.user');
      var consoleInfo = modelManager.retrieve('app.model.consoleInfo');
      var services = _.filter(userCnsiModel.serviceInstances, {cnsi_type: 'hcf', valid: true, error: false});
      if (services.length > 0) {
        _.each(services, function (service) {
          var endpointUser = _.get(consoleInfo.info.endpoints.hcf, service.guid + '.user');
          if (_.isNull(endpointUser)) {
            // User hasn't connected to this endpoint
            return;
          } else if (isInitialized(service.guid, endpointUser)) {
            // We have already initialised for this endpoint + user
            return;
          }
          authModelInitPromise.push(initializeForEndpoint(service.guid, true).catch(angular.noop));
        });

        return $q.all(authModelInitPromise);
      }

      return $q.resolve();
    }
    /**
     * @name initializeForEndpoint
     * @description Initialize a principal instance for connected CF
     * @param {string} cnsiGuid - Cluster Guid
     * @param {boolean} useconsoleInfoCache - Set to true if consoleInfo has already been fetched
     * @returns {*}
     */
    function initializeForEndpoint(cnsiGuid, useconsoleInfoCache) {

      model.principal[cnsiGuid] = null;
      var consoleInfo = modelManager.retrieve('app.model.consoleInfo');
      var featureFlagsModel = modelManager.retrieve('cloud-foundry.model.featureFlags');
      var Principal = modelManager.retrieve('cloud-foundry.model.auth.principal');
      var userModel = modelManager.retrieve('cloud-foundry.model.users');

      var featureFlagsPromise = featureFlagsModel.fetch(cnsiGuid);
      var consoleInfoPromise = $q.resolve(consoleInfo.info);
      if (!useconsoleInfoCache) {
        consoleInfoPromise = consoleInfo.getConsoleInfo();
      }

      return consoleInfoPromise.then(function (consoleInfo) {
        var userId = consoleInfo.endpoints.hcf[cnsiGuid].user.guid;
        var isAdmin = consoleInfo.endpoints.hcf[cnsiGuid].user.admin;
        var promises = [
          featureFlagsPromise
        ];

        if (isAdmin) {
          // User is an admin, therefore, we will use the more efficient userSummary request
          promises.push(userModel.getUserSummary(cnsiGuid, userId));
        } else {
          promises = promises.concat(_addOrganisationRolePromisesForUser(cnsiGuid, userId));
          promises = promises.concat(_addSpaceRolePromisesForUser(cnsiGuid, userId));
        }

        return $q.all(promises)
          .then(function (data) {
            var featureFlags = _.transform(data[0], function (result, value) {
              result[value.name] = value.enabled;
            });
            var mappedSummary;
            if (isAdmin) {
              var userSummary = data[1];
              mappedSummary = {
                organizations: {
                  audited: userSummary.entity.audited_organizations,
                  billingManaged: userSummary.entity.billing_managed_organizations,
                  managed: userSummary.entity.managed_organizations,
                  // User is a user in all these orgs
                  all: userSummary.entity.organizations
                },
                spaces: {
                  audited: userSummary.entity.audited_spaces,
                  managed: userSummary.entity.managed_spaces,
                  // User is a developer in this spaces
                  all: userSummary.entity.spaces
                }
              };
            } else {
              mappedSummary = {
                organizations: {
                  audited: data[1],
                  billingManaged: data[2],
                  managed: data[3],
                  // User is a user in all these orgs
                  all: data[4]
                },
                spaces: {
                  audited: data[5],
                  managed: data[6],
                  // User is a developer in this spaces
                  all: data[7]
                }
              };
            }
            model.principal[cnsiGuid] = new Principal(consoleInfo, mappedSummary, featureFlags, cnsiGuid);
          });
      });
    }

    /**
     * @name isAllowed
     * @description is user allowed the certain action
     * @param {string} cnsiGuid - Cluster GUID
     * @param {string} resourceType - Type is resource
     * (organization, space, user, service_managed_instances, routes, applications)
     * @param {string} action - action (create, delete, update..)
     * @returns {*}
     */
    /* eslint-disable no-unused-vars */
    function isAllowed(cnsiGuid, resourceType, action) {
      var args = Array.prototype.slice.call(arguments);
      if (!isInitialized(cnsiGuid)) {
        return false;
      }
      return model.principal[cnsiGuid].isAllowed.apply(model.principal[cnsiGuid], args.slice(1));
    }

    /* eslint-enable no-unused-vars */

    /**
     * @name isInitialized
     * @description Is authService initialized
     * @param {string} cnsiGuid - Cluster GUID
     * @param {object} userInfo - User info
     * @returns {boolean}
     */
    function isInitialized(cnsiGuid, userInfo) {

      var initialised = angular.isObject(model.principal[cnsiGuid]);

      if (userInfo && initialised) {
        initialised = model.principal[cnsiGuid].consoleInfo.endpoints.hcf[cnsiGuid].user.guid === userInfo.guid;
      }
      return initialised;
    }

    /**
     * @name remove
     * @description Remove an initialized principal for an endpoint
     * @param {string} cnsiGuid - Cluster GUID
     */
    function remove(cnsiGuid) {
      delete model.principal[cnsiGuid];
    }

    /**
     * @name doesUserHaveRole
     * @description convenience method for ascertaining is user
     * has a specific role (i.e. is user space developer anywhere?)
     * @param {string} cnsiGuid - Cluster GUID
     * @param {string} role - role
     * @returns {boolean}
     */
    function doesUserHaveRole(cnsiGuid, role) {

      // convenience method implemented for Application permissions
      if (!isInitialized(cnsiGuid)) {
        return false;
      }
      var hasRole = false;
      if (role === 'space_developer') {
        hasRole = model.principal[cnsiGuid].userSummary.spaces.all.length > 0;
      }
      return hasRole;
    }

    /**
     * @name isOrgOrSpaceActionableByResource
     * @description convenience method to determine if the user has rights to execute the action against the resource
     * in the organization or any of the organization's spaces
     * @param {string} cnsiGuid - Cluster GUID
     * @param {object} org - console organization object
     * (organization, space, user, service_managed_instances, routes, applications)
     * @param {string} action - action (create, delete, update..)
     * @returns {boolean}
     */
    function isOrgOrSpaceActionableByResource(cnsiGuid, org, action) {

      var orgGuid = org.details.org.metadata.guid;
      // Is the organization valid?
      if (isAllowed(cnsiGuid, model.resources.organization, action, orgGuid)) {
        return true;
      } else {
        // Is any of the organization's spaces valid?
        for (var spaceGuid in org.spaces) {
          if (!org.spaces.hasOwnProperty(spaceGuid)) {
            continue;
          }
          var space = org.spaces[spaceGuid];
          if (isAllowed(cnsiGuid, model.resources.space, action, space.metadata.guid, orgGuid)) {
            return true;
          }
        }
        return false;
      }
    }

    /**
     * @name isAdmin
     * @description Is User Admin in endpoint
     * @param {string} cnsiGuid - Cluster GUID
     * @returns {boolean}
     */
    function isAdmin(cnsiGuid) {
      if (!isInitialized(cnsiGuid)) {
        return false;
      }
      return model.principal[cnsiGuid].isAdmin;
    }

    /**
     * @name _addOrganisationRolePromisesForUser
     * @description private method to fetch organization roles
     * @param {string} cnsiGuid - Cluster GUID
     * @param {string} userGuid - User GUID
     * @returns {Array} promises
     * @private
     */
    function _addOrganisationRolePromisesForUser(cnsiGuid, userGuid) {
      var promises = [];
      var usersModel = modelManager.retrieve('cloud-foundry.model.users');

      promises.push(usersModel.listAllAuditedOrganizationsForUser(cnsiGuid, userGuid));
      promises.push(usersModel.listAllBillingManagedOrganizationsForUser(cnsiGuid, userGuid));
      promises.push(usersModel.listAllManagedOrganizationsForUser(cnsiGuid, userGuid));
      promises.push(usersModel.listAllOrganizationsForUser(cnsiGuid, userGuid));
      return promises;
    }

    /**
     * @name _addSpaceRolePromisesForUser
     * @description private method to fetch space roles
     * @param {string} cnsiGuid - Cluster GUID
     * @param {string} userGuid - User GUID
     * @returns {Array} promises
     * @private
     */
    function _addSpaceRolePromisesForUser(cnsiGuid, userGuid) {
      var promises = [];
      var usersModel = modelManager.retrieve('cloud-foundry.model.users');

      promises.push(usersModel.listAllAuditedSpacesForUser(cnsiGuid, userGuid));
      promises.push(usersModel.listAllManagedSpacesForUser(cnsiGuid, userGuid));
      promises.push(usersModel.listAllSpacesForUser(cnsiGuid, userGuid));
      return promises;
    }
  }
})
();
