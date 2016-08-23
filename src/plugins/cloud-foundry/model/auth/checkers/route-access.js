(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model
   * @memberOf cloud-foundry.model
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
     * @param {Array} flags feature flags
     * @constructor
     */
    function RouteAccess(principal, flags) {
      this.principal = principal;
      this.flags = flags;
      this.baseAccess = modelManager.retrieve('cloud-foundry.model.auth.checkers.baseAccess')(principal);
    }

    angular.extend(RouteAccess.prototype, {
      /**
       * @name create
       * @description User can create a route if:
       * 1. User is admin
       * 2. User is a space developer AND route_creation feature flag is turned on
       * @param {Object} space Domain space
       * @returns {boolean}
       */
      create: function (space) {
        // Admin
        if (this.baseAccess.create(space)) {
          return true;
        }

        return this.baseAccess._doesContainGuid(this.principal.userSummary.entity.spaces, space.metadata.guid) &&
          this.principal.hasAccessTo('route_creation');
      },

      /**
       * @name update
       * @description Does user have update route permission
       * @param {Object} route route detail
       * @returns {boolean}
       */
      update: function (route) {
        // Admin
        if (this.baseAccess.update(route)) {
          return true;
        }

        return this.baseAccess._doesContainGuid(this.principal.userSummary.entity.spaces, space.metadata.guid);
      },

      /**
       * @name delete
       * @description Does user have delete route permission
       * @param {Object} route route detail
       * @returns {boolean}
       */
      delete: function (route) {
        // Admin
        if (this.baseAccess.update(route)) {
          return true;
        }

        console.log(route)

        return this.baseAccess._doesContainGuid(this.principal.userSummary.entity.spaces, space.metadata.guid);

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
