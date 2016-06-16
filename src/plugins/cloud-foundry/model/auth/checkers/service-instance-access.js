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

  /**
   * @name: ServiceInstanceAccessFactory
   * @description: Function to get a ServiceInstanceAccess class
   * @param {app.api.modelManager}  modelManager - the Model management service
   * @returns {ServiceInstanceAccess}
   * @constructor
     */
  function ServiceInstanceAccessFactory(modelManager) {

    /**
     * @name: ServiceInstanceAccess
     * @description: Constructor for ServiceInstanceAccess
     * @param {Principal} principal Principal instance
     * @param {Array} flags feature flags
     * @constructor
       */
    function ServiceInstanceAccess(principal, flags) {
      this.principal = principal;
      this.flags = flags;

      this.baseAccess = modelManager.retrieve('cloud-foundry.model.auth.checkers.baseAccess')(principal);
    }

    angular.extend(ServiceInstanceAccess.prototype, {

      /**
       * @name: create
       * @description: Does user have create service instance permission in the space
       * @param {Object} space Domain space
       * @returns {boolean}
       */
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

      /**
       * @name: update
       * @description: Does user have update service instance permission
       * @param {Object} service_instance service instance detail
       * @returns {boolean}
       */
      update: function(service_instance) {
        // Admin
        if (this.baseAccess.update(service_instance)) {
          return true;
        }

        // If user is developer in space the service instances belongs to
        return this.baseAccess
          ._doesContainGuid(this.principal.userInfo.entity.spaces, service_instance.entity.space_guid);
      },

      /**
       * @name: delete
       * @description: Does user have delete application permission
       * @param {Object} service_instance service instance detail
       * @returns {boolean}
       */
      delete: function(service_instance) {
        return this.baseAccess.update(service_instance);
      },

      /**
       * @name: canHandle
       * @description: Specifies that this ACL checker can handle `managed_service_instance` permission
       * @param {String} resource
       * @returns {boolean}
       */
      canHandle: function(resource) {
        return resource === 'managed_service_instance';
      }
    });

    return ServiceInstanceAccess;
  }


})();
