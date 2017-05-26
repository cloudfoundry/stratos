(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model.ApplicationAccessFactory
   * @memberof cloud-foundry.model
   * @name ApplicationAccessFactory
   * @description CF ACL Model
   */
  angular
    .module('cloud-foundry.model')
    .run(register);

  function register(modelManager) {
    modelManager.register('cloud-foundry.model.auth.checkers.applicationAccess',
      ApplicationAccessFactory(modelManager));
  }

  /**
   * @name ApplicationAccessFactory
   * @description Function to return an ApplicationAccess class
   * @param {app.api.modelManager}  modelManager - the Model management service
   * @returns {ApplicationAccess}
   */
  function ApplicationAccessFactory(modelManager) {
    /**
     * @name ApplicationAccess
     * @description Constructor for ApplicationAccess
     * @param {Principal} principal Principal instance
     * @constructor
     */
    function ApplicationAccess(principal) {
      var baseAccess = modelManager.retrieve('cloud-foundry.model.auth.checkers.baseAccess')(principal);

      return {
        create: create,
        update: update,
        delete: deleteResource,
        canHandle: canHandle
      };

      /**
       * @name create
       * @description User can deploy apps if:
       * 1. User is an admin
       * 2. User is a space developer
       * @param {string} spaceGuid GUID of the space where the application resides
       * @returns {boolean}
       */
      function create(spaceGuid) {

        // Admin
        if (baseAccess.create(spaceGuid)) {
          return true;
        }

        // If user is developer in space app belongs to
        return baseAccess._doesContainGuid(principal.userSummary.spaces.all, spaceGuid);
      }

      /**
       * @name update
       * @description User can manage apps if:
       * 1. User is an admin
       * 2. User is a space developer
       * @param {string} spaceGuid GUID of the space where the application resides
       * @returns {boolean}
       */
      function update(spaceGuid) {
        // Admin
        if (baseAccess.update(spaceGuid)) {
          return true;
        }

        // If user is developer in space app belongs to
        return baseAccess._doesContainGuid(principal.userSummary.spaces.all, spaceGuid);
      }

      /**
       * @name deleteResource
       * @description User can delete apps if:
       * 1. User is an admin
       * 2. User is a space developer
       * @param {string} spaceGuid GUID of the space where the application resides
       * @returns {boolean}
       */
      function deleteResource(spaceGuid) {
        // Admin
        if (baseAccess.delete(spaceGuid)) {
          return true;
        }

        // If user is developer in space app belongs to
        return baseAccess._doesContainGuid(principal.userSummary.spaces.all, spaceGuid);
      }

      /**
       * @name canHandle
       * @description Specifies that this ACL checker can handle `application` permission
       * @param {String} resource - String representing the resource
       * @returns {boolean}
       */
      function canHandle(resource) {
        return resource === 'application';
      }
    }

    return ApplicationAccess;
  }

})();
