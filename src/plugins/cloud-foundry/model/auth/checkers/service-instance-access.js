(function () {
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
       * @name create
       * @description A User is can create a service if:
       * 1. They are an admin
       * 2. or they are a space developer and the feature flag is enabled
       *
       * @param {Object} space Domain space
       * @returns {boolean}
       */
      create: function (space) {

        // If user is developer in space the service instances will
        // belong to and the service_instance_creation flag is set
        return this.principal.isAdmin ||
          (this.principal.hasAccessTo('service_instance_creation') &&
          this._doesContainGuid(this.principal.userSummary.spaces.all, space.metadata.guid));
      },

      /**
       * @name update
       * @description User can update a service instance if:
       * 1. They are an admin
       * 2. or they are a space developer
       * @param {Object} serviceInstance service instance detail
       * @returns {boolean}
       */
      update: function (serviceInstance) {

        // If user is developer in space the service instances belongs to
        return this.principal.isAdmin || this.baseAccess
          ._doesContainGuid(this.principal.userSummary.spaces.all, serviceInstance.metadata.guid);
      },

      /**
       * @name delete
       * @description User can delete a service instance if:
       * 1. They are an admin
       * 2. or they are a space developer
       * @param {Object} serviceInstance service instance detail
       * @returns {boolean}
       */
      delete: function (serviceInstance) {
        return this.principal.isAdmin || this.baseAccess
            ._doesContainGuid(this.principal.userSummary.spaces.all, serviceInstance.metadata.guid);
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
