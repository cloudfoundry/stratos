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
      var usersModel = this.modelManager.retrieve('cloud-foundry.model.users');
      var Principal = this.modelManager.retrieve('cloud-foundry.model.auth.principal');

      var featureFlagsPromise = featureFlagsModel.fetch(cnsiGuid);
      var stackatoInfoPromise = stackatoInfo.getStackatoInfo();

      return this.$q.all([featureFlagsPromise, stackatoInfoPromise])
        .then(function (promises) {
          var featureFlags = promises[0];
          var stackatoInfo = promises[1];
          return usersModel.getUserSummary(cnsiGuid, stackatoInfo.endpoints.hcf[cnsiGuid].user.guid)
            .then(function (userSummary) {
              console.log('Initialising auth service');
              that.principal = new Principal(stackatoInfo, userSummary, featureFlags, cnsiGuid);
            });
        });
    },

    isAllowed: function (context, resourceType, action) {
      return this.principal.isAllowed(context, resourceType, action);
    },

    isInitialized: function () {
      return this.principal !== null;
    }

  });

})();
