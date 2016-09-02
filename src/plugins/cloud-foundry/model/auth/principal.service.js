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
    this.principal = null;
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
  }

  angular.extend(AuthService.prototype, {

    /**
     * @name initAuthService
     * @description get a Principal instance for the current user
     * @param {string} cnsiGuid - Cluster Guid
     * @returns {*}
     */
    initAuthService: function (cnsiGuid) {
      var that = this;

      this.principal = null;

      var featureFlagsModel = this.modelManager.retrieve('cloud-foundry.model.featureFlags');
      var stackatoInfo = this.modelManager.retrieve('app.model.stackatoInfo');
      var Principal = this.modelManager.retrieve('cloud-foundry.model.auth.principal');

      var featureFlagsPromise = featureFlagsModel.fetch(cnsiGuid);
      var stackatoInfoPromise = stackatoInfo.getStackatoInfo();
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
                  audited: userRoles[0],
                  billingManaged: userRoles[1],
                  managed: userRoles[2],
                  // User is a user in all these orgs
                  all: userRoles[3]
                },
                spaces: {
                  audited: userRoles[4],
                  managed: userRoles[5],
                  // User is a developer in this spaces
                  all: userRoles[6]
                }
              };
              that.principal = new Principal(stackatoInfo, userSummary, featureFlags, cnsiGuid);
            });
        });
    },

    /**
     * @name isAllowed
     * @description is user allowed the certain action
     * @param {string} resourceType - Type is resource
     * (organization, space, user, service_managed_instances, routes, applications)
     * @param {string} action - action (create, delete, update..)
     * @returns {*}
     */
    /* eslint-disable */
    isAllowed: function (resourceType, action) {
      return this.principal.isAllowed.apply(this.principal, arguments);
    },
    /* eslint-enable */

    /**
     * @name isInitialized
     * @description Is authService intialised
     * @returns {boolean}
     */
    isInitialized: function () {
      return this.principal !== null;
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
