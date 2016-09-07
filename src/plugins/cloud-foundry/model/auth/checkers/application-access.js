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

  register.$inject = [
    'app.model.modelManager'
  ];

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
      this.principal = principal;
      this.baseAccess = modelManager.retrieve('cloud-foundry.model.auth.checkers.baseAccess')(principal);
    }

    angular.extend(ApplicationAccess.prototype, {
      /**
       * @name create
       * @description User can deploy apps if:
       * 1. User is an admin
       * 2. User is a space developer
       * @param {string} spaceGuid GUID of the space where the application resides
       * @returns {boolean}
       */
      create: function (spaceGuid) {

        // Admin
        if (this.baseAccess.create(spaceGuid)) {
          return true;
        }

        // If user is developer in space app belongs to
        return this.baseAccess._doesContainGuid(this.principal.userSummary.spaces.all, spaceGuid);
      },

      /**
       * @name update
       * @description User can manage apps if:
       * 1. User is an admin
       * 2. User is a space developer
       * @param {string} spaceGuid GUID of the space where the application resides
       * @returns {boolean}
       */
      update: function (spaceGuid) {
        // Admin
        if (this.baseAccess.update(spaceGuid)) {
          return true;
        }

        // If user is developer in space app belongs to
        return this.baseAccess._doesContainGuid(this.principal.userSummary.spaces.all, spaceGuid);
      },

      /**
       * @name delete
       * @description User can delete apps if:
       * 1. User is an admin
       * 2. User is a space developer
       * @param {string} spaceGuid GUID of the space where the application resides
       * @returns {boolean}
       */
      delete: function (spaceGuid) {
        // Admin
        if (this.baseAccess.delete(spaceGuid)) {
          return true;
        }

        // If user is developer in space app belongs to
        return this.baseAccess._doesContainGuid(this.principal.userSummary.spaces.all, spaceGuid);
      },

      /**
       * @name canHandle
       * @description Specifies that this ACL checker can handle `application` permission
       * @param {String} resource - String representing the resource
       * @returns {boolean}
       */
      canHandle: function (resource) {
        return resource === 'application';
      }
    });

    return ApplicationAccess;
  }

})();
