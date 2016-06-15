(function() {
  'use strict';

  /**
   * @namespace cloud-foundry.model
   * @memberOf cloud-foundry.model
   * @name OrganizationAccess
   * @description CF ACL Model
   */
  angular
    .module('cloud-foundry.model')
    .run(register);

  register.$inject = [
    'app.model.modelManager'
  ];

  function register(modelManager) {
    modelManager.register('cloud-foundry.model.auth.checkers.organizationAccess',
      OrganizationAccessFactory(modelManager));
  }


  function OrganizationAccessFactory(modelManager) {

    function OrganizationAccess(principal, flags) {
      this.principal = principal;
      this.flags = flags;
      this.baseAccess = modelManager.retrieve('cloud-foundry.model.auth.checkers.baseAccess')(principal);

    }

    angular.extend(OrganizationAccess.prototype, {

      // TODO
      update: function(org) {
        if (this.baseAccess.update(org)) {
          return true;
        }

        // If user is manager of org
        return this.baseAccess
          ._doesContainGuid(this.principal.userInfo.entity.managed_organizations, org.metadata.guid);
      },

      canHandle: function(resource) {
        return resource === 'organization';
      }
    });

    return OrganizationAccess;
  }


})();
