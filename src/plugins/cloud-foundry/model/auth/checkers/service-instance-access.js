(function() {
  'use strict';

  /**
   * @namespace cloud-foundry.model
   * @memberOf cloud-foundry.model
   * @name ServiceInstanceAccess
   * @description CF ACL Model
   */
  angular
    .module('cloud-foundry.model')
    .run(register);

  register.$inject = [
    'app.model.modelManager'
  ];

  function register(modelManager) {
    modelManager.register('cloud-foundry.model.auth.checkers.serviceInstanceAccess',
      ServiceInstanceAccessFactory(modelManager));
  }


  function ServiceInstanceAccessFactory(modelManager) {

    function ServiceInstanceAccess(principal, flags) {
      this.principal = principal;
      this.flags = flags;

      this.baseAccess = modelManager.retrieve('cloud-foundry.model.auth.checkers.baseAccess')(principal);
    }

    angular.extend(ServiceInstanceAccess.prototype, {

      create: function(space) {

        // Admin
        if (this.baseAccess.create(space)) {
          return true;
        }

        // If user is developer in space the service instances will
        // belong to and the service_instance_creation flag is set
        return this.principal.hasAccessTo('service_instance_creation', this.flags) &&
          this._doesContainGuid(this.principal.userInfo.entity.spaces, space.metadata.guid);
      },

      update: function(service_instance) {
        // Admin
        if (this.baseAccess.update(service_instance)) {
          return true;
        }

        // If user is developer in space the service instances belongs to
        return this.baseAccess
          ._doesContainGuid(this.principal.userInfo.entity.spaces, service_instance.entity.space_guid);
      },

      delete: function(service_instance) {
        return this.baseAccess.update(service_instance);
      },

      canHandle: function(resource) {
        return resource === 'managed_service_instance';
      }
    });

    return ServiceInstanceAccess;
  }


})();
