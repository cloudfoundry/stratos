(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model
   * @memberOf cloud-foundry.model
   * @name PrincipalFactory
   * @description CF ACL Model
   */
  angular
    .module('cloud-foundry.model')
    .run(register);

  register.$inject = [
    'app.model.modelManager'
  ];

  function register(modelManager) {
    modelManager.register('cloud-foundry.model.auth.principalFactory',
      PrincipalFactory(modelManager));
  }

  /**
   * @name PrincipalFactory
   * @description Function to return a Principal instance
   * @param {app.api.modelManager}  modelManager - the Model management service
   * @returns {Principal}
   */
  function PrincipalFactory(modelManager) {

    return {
      create: function (authInfo) {

        var Principal = modelManager.retrieve('cloud-foundry.model.auth.principal');
        return new Principal(authInfo.username,
          authInfo.expires_in || authInfo.expiresIn,
          authInfo.isAdmin,
          authInfo.userInfo);
      }
    };
  }

})();
