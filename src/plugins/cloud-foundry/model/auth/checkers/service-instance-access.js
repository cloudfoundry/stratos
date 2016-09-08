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

  register.$inject = [
    'app.model.modelManager'
  ];

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
      this.principal = principal;
      this.baseAccess = modelManager.retrieve('cloud-foundry.model.auth.checkers.baseAccess')(principal);
    }

    angular.extend(ServiceInstanceAccess.prototype, {

      /**
       * @name create
       * @description A User is can create a service if:
       * 1. User is an admin
       * 2. Is a space developer and the feature flag is enabled
       * @param {Object} spaceGuid Space Guid
       * @returns {boolean}
       */
      create: function (spaceGuid) {

        // If user is developer in space the service instances will
        // belong to and the service_instance_creation flag is set
        // Admin
        if (this.baseAccess.create(spaceGuid)) {
          return true;
        }

        return this.principal.hasAccessTo('service_instance_creation') &&
          this.baseAccess._doesContainGuid(this.principal.userSummary.spaces.all, spaceGuid);
      },

      /**
       * @name update
       * @description User can update a service instance if:
       * 1. User is an admin
       * 2. or a space developer
       * @param {Object} spaceGuid Space Guid
       * @returns {boolean}
       */
      update: function (spaceGuid) {
        // Admin
        if (this.baseAccess.create(spaceGuid)) {
          return true;
        }

        return this.baseAccess._doesContainGuid(this.principal.userSummary.spaces.all, spaceGuid);
      },

      /**
       * @name delete
       * @description User can delete a service instance if:
       * 1. They are an admin
       * 2. or they are a space developer
       * @param {Object} spaceGuid Space Guid
       * @returns {boolean}
       */
      delete: function (spaceGuid) {
        // Admin
        if (this.baseAccess.delete(spaceGuid)) {
          return true;
        }

        return this.baseAccess._doesContainGuid(this.principal.userSummary.spaces.all, spaceGuid);

      },

      /**
       * @name canHandle
       * @description Specifies that this ACL checker can handle `managed_service_instance` permission
       * @param {String} resource - string representing the resource
       * @returns {boolean}
       */
      canHandle: function (resource) {
        return resource === 'managed_service_instance';
      }
    });

    return ServiceInstanceAccess;
  }

})();
