(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model.RouteAccess
   * @memberof cloud-foundry.model
   * @name RouteAccess
   * @description CF ACL Model
   */
  angular
    .module('cloud-foundry.model')
    .run(register);

  register.$inject = [
    'app.model.modelManager'
  ];

  function register(modelManager) {
    modelManager.register('cloud-foundry.model.auth.checkers.routeAccess',
      RouteAccessFactory(modelManager));
  }

  /**
   * @name RouteAccessFactory
   * @description Function to return an RouteAccess class
   * @param {app.api.modelManager}  modelManager - the Model management service
   * @returns {RouteAccess}
   */
  function RouteAccessFactory(modelManager) {
    /**
     * @name RouteAccess
     * @description Constructor for RouteAccess
     * @param {Principal} principal Principal instance
     * @constructor
     */
    function RouteAccess(principal) {
      this.principal = principal;
      this.baseAccess = modelManager.retrieve('cloud-foundry.model.auth.checkers.baseAccess')(principal);
    }

    angular.extend(RouteAccess.prototype, {
      /**
       * @name create
       * @description User can create a route if:
       * 1. User is admin
       * 2. User is a space developer AND route_creation feature flag is turned on
       * @param {string} spaceGuid GUID of the space where the application resides
       * @returns {boolean}
       */
      create: function (spaceGuid) {
        // Admin
        if (this.baseAccess.create(spaceGuid)) {
          return true;
        }

        return this.baseAccess._doesContainGuid(this.principal.userSummary.spaces.all, spaceGuid) &&
          this.principal.hasAccessTo('route_creation');
      },

      /**
       * @name update
       * @description User can create a route if:
       * 1. User is admin
       * 2. User is a space developer
       * @param {string} spaceGuid GUID of the space where the application resides
       * @returns {boolean}
       */
      update: function (spaceGuid) {
        // Admin
        if (this.baseAccess.update(spaceGuid)) {
          return true;
        }

        return this.baseAccess._doesContainGuid(this.principal.userSummary.spaces.all, spaceGuid);
      },

      /**
       * @name delete
       * @description User can create a route if:
       * 1. User is admin
       * 2. User is a space developer
       * @param {string} spaceGuid GUID of the space where the application resides
       * @returns {boolean}
       */
      delete: function (spaceGuid) {
        // Admin
        if (this.baseAccess.update(spaceGuid)) {
          return true;
        }

        return this.baseAccess._doesContainGuid(this.principal.userSummary.spaces.all, spaceGuid);

      },

      /**
       * @name canHandle
       * @description Specifies that this ACL checker can handle `route` permission
       * @param {String} resource - string representing the resource
       * @returns {boolean}
       */
      canHandle: function (resource) {
        return resource === 'route';
      }
    });

    return RouteAccess;
  }

})();
