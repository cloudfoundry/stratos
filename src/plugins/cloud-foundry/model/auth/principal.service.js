(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model
   * @memberOf cloud-foundry.model
   * @name PrincipalService
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
   * @constructor
   */
  function AuthService(modelManager, $q) {
    this.modelManager = modelManager;
    this.principal = null;
    this.$q = $q;

  }

  angular.extend(AuthService.prototype, {

    /**
     * @name initAuthService
     * @description get a Principal instance for the current user
     */
    initAuthService: function (cnsiGuid) {
      var that = this;

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
              that.principal = new Principal(stackatoInfo, userSummary, featureFlags, cnsiGuid);
            });
        });
    },

    isAllowed: function () {
      return this.principal.isAllowed.apply(this.principal, arguments);
    },

    isInitialized: function () {
      return this.principal !== null;
    },

    _addOrganisationRolePromisesForUser: function (cnsiGuid, userGuid) {
      var promises = [];
      var usersModel = this.modelManager.retrieve('cloud-foundry.model.users');

      promises.push(usersModel.listAllAuditedOrganizationsForUser(cnsiGuid, userGuid));
      promises.push(usersModel.listAllBillingManagedOrganizationsForUser(cnsiGuid, userGuid));
      promises.push(usersModel.listAllManagedOrganizationsForUser(cnsiGuid, userGuid));
      promises.push(usersModel.listAllOrganizationsForUser(cnsiGuid, userGuid));
      return promises;
    },
    _addSpaceRolePromisesForUser: function (cnsiGuid, userGuid) {
      var promises = [];
      var usersModel = this.modelManager.retrieve('cloud-foundry.model.users');

      promises.push(usersModel.listAllAuditedSpacesForUser(cnsiGuid, userGuid));
      promises.push(usersModel.listAllManagedSpacesForUser(cnsiGuid, userGuid));
      promises.push(usersModel.listAllSpacesForUser(cnsiGuid, userGuid));
      return promises;
    }

  });

})();
