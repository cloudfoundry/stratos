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
    'app.model.modelManager'
  ];

  function register(modelManager) {
    var principalFactory = modelManager.retrieve('cloud-foundry.model.auth.principalFactory');
    modelManager.register('cloud-foundry.model.auth', new PrincipalService(principalFactory));
  }

  /**
   * @name PrincipalService
   * @param {Object} principalFactory - factor to retrieve initialised Principal object
   * @constructor
   */
  function PrincipalService(principalFactory) {
    // Original implementation also passed in $localStorage which was used
    // to store and retrieve `currentUser`
    this.principalFactory = principalFactory;
  }

  angular.extend(PrincipalService.prototype, {
    /* eslint-disable */
    //TODO(irfran): Not original implement relied on localStorage to retrieve current user https://jira.hpcloud.net/browse/TEAMFOUR-625
    /* eslint-enable */
    /**
     * @name getCurrentUser
     * @description Retrieves current user
     */
    getCurrentUser: function () {
      // Original implementation retrieved `currentUser` from localStorage
      // var currentUser = this.localStorage.currentUser;
      // if(angular.isDefined(currentUser)) {
      //   return this.principalFactory.create(currentUser);
      // } else {
      //   return;
      // }
    },

    /* eslint-disable */
    // TODO(irfran): Not original implement relied on localStorage to store current user https://jira.hpcloud.net/browse/TEAMFOUR-625
    /* eslint-enable */
    /**
     * @name setCurrentUser
     * @description get a Principal instance for the current user
     * @param {Object} authInfo - object containing authentication information
     */
    setCurrentUser: function (authInfo) {
      var currentUser = this.principalFactory.create(authInfo);   // eslint-disable-line no-unused-vars
      // this.localStorage.currentUser = currentUser;
    }
  });

})();
