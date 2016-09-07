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

  register.$inject = [
    'app.model.modelManager',
    '$q'
  ];

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
    this.modelManager = modelManager;
    this.stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');

    // Initialised authorization checkers for individual CNSIs
    this.principal = {};
    this.$q = $q;

    this.resources = {
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
    };

    this.actions = {
      create: 'create',
      update: 'update',
      delete: 'delete',
      rename: 'rename'
    };

    this.roles = {
      space_developer: 'space_developer'
    };
  }

  angular.extend(AuthModel.prototype, {

    /**
     * @name initialize
     * @description Initialize AuthModel for all connected endpoints
     * @returns {promise} Initialization promise
     */
    initialize: function () {
      // Initialise Auth Service
      var that = this;
      var authModelInitPromise = [];
      if (Object.keys(this.stackatoInfo.info.endpoints.hcf).length > 0) {
        _.each(that.stackatoInfo.info.endpoints.hcf, function (hcfEndpoint, guid) {
          if (_.isNull(hcfEndpoint.user)) {
            // User hasn't connected to this endpoint
            return;
          } else if (that.isInitialized(guid, hcfEndpoint.user)) {
            // We have already initialised for this endpoint + user
            return;
          }
          authModelInitPromise.push(that.initializeForEndpoint(guid, true));
        });
        return that.$q.all(authModelInitPromise);
      }

      return that.$q.resolve();
    },
    /**
     * @name initializeForEndpoint
     * @description Initialize a principal instance for connected CF
     * @param {string} cnsiGuid - Cluster Guid
     * @param {boolean} useStackatoInfoCache - Set to true if StackatoInfo has already been fetched
     * @returns {*}
     */
    initializeForEndpoint: function (cnsiGuid, useStackatoInfoCache) {
      var that = this;

      this.principal[cnsiGuid] = null;

      var featureFlagsModel = this.modelManager.retrieve('cloud-foundry.model.featureFlags');
      var stackatoInfo = this.modelManager.retrieve('app.model.stackatoInfo');
      var Principal = this.modelManager.retrieve('cloud-foundry.model.auth.principal');
      var userModel = this.modelManager.retrieve('cloud-foundry.model.users');

      var featureFlagsPromise = featureFlagsModel.fetch(cnsiGuid);
      var stackatoInfoPromise = this.$q.resolve(stackatoInfo.info);
      if (!useStackatoInfoCache) {
        stackatoInfoPromise = stackatoInfo.getStackatoInfo();
      }
      return this.$q.all([featureFlagsPromise, stackatoInfoPromise])
        .then(function (data) {
          var featureFlags = _.transform(data[0], function (result, value) {
            result[value.name] = value.enabled;
          });
          var stackatoInfo = data[1];
          var userId = stackatoInfo.endpoints.hcf[cnsiGuid].user.guid;
          var isAdmin = stackatoInfo.endpoints.hcf[cnsiGuid].user.admin;

          if (isAdmin) {
            // User is an admin, therefore, we will use the more efficient userSummary request
            return userModel.getUserSummary(cnsiGuid, userId)
              .then(function (userSummary) {
                var mappedSummary = {
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
                that.principal[cnsiGuid] = new Principal(stackatoInfo, mappedSummary, featureFlags, cnsiGuid);

              });

          } else {
            var promises = that._addOrganisationRolePromisesForUser(cnsiGuid, userId);
            promises = promises.concat(that._addSpaceRolePromisesForUser(cnsiGuid, userId));
            return that.$q.all(promises)
              .then(function (userRoles) {
                var userSummary = {
                  organizations: {
                    audited: userRoles[0].data.resources,
                    billingManaged: userRoles[1].data.resources,
                    managed: userRoles[2].data.resources,
                    // User is a user in all these orgs
                    all: userRoles[3].data.resources
                  },
                  spaces: {
                    audited: userRoles[4].data.resources,
                    managed: userRoles[5].data.resources,
                    // User is a developer in this spaces
                    all: userRoles[6].data.resources
                  }
                };
                that.principal[cnsiGuid] = new Principal(stackatoInfo, userSummary, featureFlags, cnsiGuid);

              });
          }

        });
    },

    /**
     * @name isAllowed
     * @description is user allowed the certain action
     * @param {string} cnsiGuid - Cluster GUID
     * @param {string} resourceType - Type is resource
     * (organization, space, user, service_managed_instances, routes, applications)
     * @param {string} action - action (create, delete, update..)
     * @returns {*}
     */
    /* eslint-disable */
    isAllowed: function (cnsiGuid, resourceType, action) {
      var args = Array.prototype.slice.call(arguments);
      return this.principal[cnsiGuid].isAllowed.apply(this.principal[cnsiGuid], args.slice(1));
    },
    /* eslint-enable */

    /**
     * @name isInitialized
     * @description Is authService initialized
     * @param {string} cnsiGuid - Cluster GUID
     * @param {object} userInfo - User info
     * @returns {boolean}
     */
    isInitialized: function (cnsiGuid, userInfo) {

      var initialised = angular.isObject(this.principal[cnsiGuid]);

      if (userInfo && initialised) {
        initialised = this.principal[cnsiGuid].stackatoInfo.endpoints.hcf[cnsiGuid].user.guid === userInfo.guid;
      }
      return initialised;
    },

    /**
     * @name remove
     * @description Remove an initialized principal for an endpoint
     * @param {string} cnsiGuid - Cluster GUID
     */
    remove: function (cnsiGuid) {
      delete this.principal[cnsiGuid];
    },

    /**
     * @name doesUserHaveRole
     * @description convenience method for ascertaining is user
     * has a specific role (i.e. is user space developer anywhere?)
     * @param {string} cnsiGuid - Cluster GUID
     * @param {string} role - role
     * @returns {boolean}
     */
    doesUserHaveRole: function (cnsiGuid, role) {

      // convenience method implemented for Application permissions
      var cnsiPrincipal = this.principal[cnsiGuid];
      if (_.isUndefined(cnsiPrincipal)) {
        // Principal object is probably being initialised
        // Unable to ascertain is user has role now
        return false;
      }
      var hasRole = false;
      if (role === 'space_developer') {
        hasRole = cnsiPrincipal.userSummary.spaces.all.length > 0;
      }
      return hasRole;
    },

    /**
     * @name isAdmin
     * @description Is User Admin in endpoint
     * @param {string} cnsiGuid - Cluster GUID
     * @returns {boolean}
     */
    isAdmin: function (cnsiGuid) {
      return this.principal[cnsiGuid].isAdmin;
    },

    /**
     * @name _addOrganisationRolePromisesForUser
     * @description private method to fetch organization roles
     * @param {string} cnsiGuid - Cluster GUID
     * @param {string} userGuid - User GUID
     * @returns {Array} promises
     * @private
     */
    _addOrganisationRolePromisesForUser: function (cnsiGuid, userGuid) {
      var promises = [];
      var usersModel = this.modelManager.retrieve('cloud-foundry.model.users');

      promises.push(usersModel.listAllAuditedOrganizationsForUser(cnsiGuid, userGuid));
      promises.push(usersModel.listAllBillingManagedOrganizationsForUser(cnsiGuid, userGuid));
      promises.push(usersModel.listAllManagedOrganizationsForUser(cnsiGuid, userGuid));
      promises.push(usersModel.listAllOrganizationsForUser(cnsiGuid, userGuid));
      return promises;
    },

    /**
     * @name _addSpaceRolePromisesForUser
     * @description private method to fetch space roles
     * @param {string} cnsiGuid - Cluster GUID
     * @param {string} userGuid - User GUID
     * @returns {Array} promises
     * @private
     */
    _addSpaceRolePromisesForUser: function (cnsiGuid, userGuid) {
      var promises = [];
      var usersModel = this.modelManager.retrieve('cloud-foundry.model.users');

      promises.push(usersModel.listAllAuditedSpacesForUser(cnsiGuid, userGuid));
      promises.push(usersModel.listAllManagedSpacesForUser(cnsiGuid, userGuid));
      promises.push(usersModel.listAllSpacesForUser(cnsiGuid, userGuid));
      return promises;
    }
  });
})
();
