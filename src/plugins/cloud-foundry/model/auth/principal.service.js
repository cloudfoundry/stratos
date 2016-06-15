(function() {
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


  function PrincipalService(principalFactory) {

    // Original implementation also passed in $localStorage which was used
    // to store and retrieve `currentUser`
    this.principalFactory = principalFactory;

  }

  angular.extend(PrincipalService.prototype, {

    getCurrentUser: function() {
      // Original implementation retrieved `currentUser` from localStorage
      // var currentUser = this.localStorage.currentUser;
      // if(angular.isDefined(currentUser)) {
      //   return this.principalFactory.create(currentUser);
      // } else {
      //   return;
      // }
    },

    setCurrentUser: function(authInfo) {
      var currentUser = this.principalFactory.create(authInfo);
      // this.localStorage.currentUser = currentUser;

    }
  });

})();
