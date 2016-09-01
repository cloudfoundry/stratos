(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model.AuthService
   * @memberof cloud-foundry.model
   * @name AuthService
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
    modelManager.register('cloud-foundry.model.auth', new AuthService(modelManager, $q));
  }

  /**
   * @name AuthService
   * @param {object} modelManager - Model Manager
   * @param {object} $q - angular $q service
   * @constructor
   */
  function AuthService(modelManager, $q) {
    this.modelManager = modelManager;

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

  angular.extend(AuthService.prototype, {

    /**
     * @name initAuthService
     * @description get a Principal instance for the current user
     * @param {string} cnsiGuid - Cluster Guid
     * @param {boolean} useStackatoInfoCache - Set to true if StackatoInfo has already been fetched
     * @returns {*}
     */
    initAuthService: function (cnsiGuid, useStackatoInfoCache) {
      var that = this;

      this.principal[cnsiGuid] = null;

      var featureFlagsModel = this.modelManager.retrieve('cloud-foundry.model.featureFlags');
      var stackatoInfo = this.modelManager.retrieve('app.model.stackatoInfo');
      var Principal = this.modelManager.retrieve('cloud-foundry.model.auth.principal');

      var featureFlagsPromise = featureFlagsModel.fetch(cnsiGuid);
      var stackatoInfoPromise = this.$q.resolve(stackatoInfo.info);
      if (useStackatoInfoCache) {
        stackatoInfoPromise = stackatoInfo.getStackatoInfo();
      }
      return this.$q.all([featureFlagsPromise, stackatoInfoPromise])
        .then(function (data) {
          var featureFlags = data[0];
          var stackatoInfo = data[1];
          var userId = stackatoInfo.endpoints.hcf[cnsiGuid].user.guid;

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
     * @description Is authService intialised
     * @param {string} cnsiGuid - Cluster GUID
     * @returns {boolean}
     */
    isInitialized: function (cnsiGuid) {
      return _.has(this.principal, cnsiGuid) && this.principal !== null;
    },

    /**
     * @name doesUserHaveRole
     * @description convenience method for ascertaining is user
     * has a specific role (i.e. is user space developer anywhere?)
     * @param cnsiGuid
     * @param role
     * @returns {boolean}
     */
    doesUserHaveRole: function (cnsiGuid, role) {

      // convenience method implemented for Application permissions
      var cnsiPrincipal = this.principal[cnsiGuid];
      var hasRole = false;
      if (role === 'space_developer') {
        hasRole = cnsiPrincipal.userSummary.spaces.all.length > 0;
      }
      return hasRole;
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
