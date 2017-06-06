(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model.ServiceInstanceAccess
   * @memberof cloud-foundry.model
   * @name ServiceInstanceAccess
   * @description CF ACL Model
   */
  angular
    .module('cloud-foundry.model')
    .run(register);

  function register(modelManager) {
    modelManager.register('cloud-foundry.model.auth.checkers.serviceInstanceAccess',
      ServiceInstanceAccessFactory(modelManager));
  }

  /**
   * @name ServiceInstanceAccessFactory
   * @description Function to get a ServiceInstanceAccess class
   * @param {app.api.modelManager}  modelManager - the Model management service
   * @returns {ServiceInstanceAccess}
   * @constructor
   */
  function ServiceInstanceAccessFactory(modelManager) {
    /**
     * @name ServiceInstanceAccess
     * @description Constructor for ServiceInstanceAccess
     * @param {Principal} principal Principal instance
     * @constructor
     */
    function ServiceInstanceAccess(principal) {
      var baseAccess = modelManager.retrieve('cloud-foundry.model.auth.checkers.baseAccess')(principal);

      return {
        create: create,
        update: update,
        delete: deleteResource,
        canHandle: canHandle
      };

      /**
       * @name create
       * @description A User is can create a service if:
       * 1. User is an admin
       * 2. Is a space developer and the feature flag is enabled
       * @param {Object} spaceGuid Space Guid
       * @returns {boolean}
       */
      function create(spaceGuid) {
        // If user is developer in space the service instances will
        // belong to and the service_instance_creation flag is set
        // Admin
        if (baseAccess.create(spaceGuid)) {
          return true;
        }

        return principal.hasAccessTo('service_instance_creation') &&
          baseAccess._doesContainGuid(principal.userSummary.spaces.all, spaceGuid);
      }

      /**
       * @name update
       * @description User can update a service instance if:
       * 1. User is an admin
       * 2. or a space developer
       * @param {Object} spaceGuid Space Guid
       * @returns {boolean}
       */
      function update(spaceGuid) {
        // Admin
        if (baseAccess.create(spaceGuid)) {
          return true;
        }

        return baseAccess._doesContainGuid(principal.userSummary.spaces.all, spaceGuid);
      }

      /**
       * @name delete
       * @description User can delete a service instance if:
       * 1. They are an admin
       * 2. or they are a space developer
       * @param {Object} spaceGuid Space Guid
       * @returns {boolean}
       */
      function deleteResource(spaceGuid) {
        // Admin
        if (baseAccess.delete(spaceGuid)) {
          return true;
        }

        return baseAccess._doesContainGuid(principal.userSummary.spaces.all, spaceGuid);

      }

      /**
       * @name canHandle
       * @description Specifies that this ACL checker can handle `managed_service_instance` permission
       * @param {String} resource - string representing the resource
       * @returns {boolean}
       */
      function canHandle(resource) {
        return resource === 'managed_service_instance';
      }
    }

    return ServiceInstanceAccess;
  }

})();
