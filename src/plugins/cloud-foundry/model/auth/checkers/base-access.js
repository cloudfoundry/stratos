(function() {
  'use strict';

  /**
   * @namespace cloud-foundry.model
   * @memberOf cloud-foundry.model
   * @name BaseAccess
   * @description CF ACL Model
   */
  angular
    .module('cloud-foundry.model')
    .run(register);

  register.$inject = [
    'app.model.modelManager'
  ];

  function register(modelManager) {
    modelManager.register('cloud-foundry.model.auth.checkers.baseAccess', BaseAccess);
  }


  function BaseAccess(principal) {

    return {
      create: function() {
        return principal.isAdmin();
      },

      update: function() {
        return principal.isAdmin();
      },

      delete: function() {
        return principal.isAdmin();
      },
      _doesContainGuid: function(array, guid) {
        return array.map(function(element) {
            return element.metadata.guid;
          }).indexOf(guid) > -1;
      }

    };
  }
})();
