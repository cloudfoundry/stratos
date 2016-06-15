(function() {
  'use strict';

  /**
   * @namespace cloud-foundry.model
   * @memberOf cloud-foundry.model
   * @name ApplicationAccessFactory
   * @description CF ACL Model
   */
  angular
    .module('cloud-foundry.model')
    .run(register);

  register.$inject = [
    'app.model.modelManager'
  ];

  function register(modelManager) {
    modelManager.register('cloud-foundry.model.auth.checkers.applicationAccess',
      ApplicationAccessFactory(modelManager));
  }


  function ApplicationAccessFactory(modelManager) {

    // BaseAccess is injected by users, because we can't do the following as it may not be available
    // var BaseAccess = modelManager.retrieve('cloud-foundry.model.auth.checkers.baseAccess');

    function ApplicationAccess(principal, flags) {
      this.principal = principal;
      this.flags = flags;
      this.baseAccess = modelManager.retrieve('cloud-foundry.model.auth.checkers.baseAccess')(principal);

    }

    angular.extend(ApplicationAccess.prototype, {

      create: function(space) {

        // Admin
        if (this.baseAccess.create(space)) {
          return true;
        }

        // If user is developer in space app belongs to
        return this.baseAccess._doesContainGuid(this.principal.userInfo.entity.spaces, space.metadata.guid);
      },

      update: function(app) {

        // Admin
        if (this.baseAccess.update(app)) {
          return true;
        }

        // If user is developer in space app belongs to
        return this.baseAccess._doesContainGuid(this.principal.userInfo.entity.spaces, app.entity.space_guid);

      },
      delete: function(app) {
        return this.baseAccess.update(app);
      },
      canHandle: function(resource) {
        return resource === 'application';
      }
    });

    return ApplicationAccess;
  }


})();
