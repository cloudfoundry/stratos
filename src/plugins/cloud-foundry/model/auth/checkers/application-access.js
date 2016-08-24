(function () {
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
     * @param {Array} flags feature flags
     * @constructor
     */
    function ApplicationAccess(principal, flags) {
      this.principal = principal;
      this.flags = flags;
      this.baseAccess = modelManager.retrieve('cloud-foundry.model.auth.checkers.baseAccess')(principal);
    }

    angular.extend(ApplicationAccess.prototype, {
      /**
       * @name create
       * @description Does user have create application permission in the space
       * @param {Object} space Domain space
       * @returns {boolean}
       */
      create: function (space) {
        // Admin
        if (this.baseAccess.create(space)) {
          return true;
        }

        // If user is developer in space app belongs to
        return this.baseAccess._doesContainGuid(this.principal.userSummary.spaces.all, space.metadata.guid);
      },

      /**
       * @name update
       * @description Does user have update application permission
       * @param {Object} app Application detail
       * @returns {boolean}
       */
      update: function (app) {
        // Admin
        if (this.baseAccess.update(app)) {
          return true;
        }

        // If user is developer in space app belongs to
        return this.baseAccess._doesContainGuid(this.principal.userSummary.spaces.all, space.metadata.guid);
      },

      /**
       * @name delete
       * @description Does user have delete application permission
       * @param {Object} app - Application detail
       * @returns {boolean}
       */
      delete: function (app) {
        return this.baseAccess.delete(app);
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
