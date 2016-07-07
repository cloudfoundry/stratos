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
       * @description Does user have create route permission in the space
       * @param {Object} space Domain space
       * @returns {boolean}
       */
      create: function (space) {
        // Admin
        if (this.baseAccess.create(space)) {
          return true;
        }

        // If user is manager of org that owns the space
        if (this.baseAccess._doesContainGuid(this.principal.userInfo.entity.managed_organizations,
            space.entity.organization_guid)) {
          return true;
        }

        // If user is manager in space
        if (this.baseAccess._doesContainGuid(this.principal.userInfo.entity.managed_spaces, space.metadata.guid)) {
          return true;
        }

        // Finally, if user is developer in space
        return this.baseAccess._doesContainGuid(this.principal.userInfo.entity.spaces, space.metadata.guid);
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

        // If user is manager of org that owns the space
        if (this.baseAccess._doesContainGuid(this.principal.userInfo.entity.managed_organizations,
            route.entity.space.entity.organization_guid)) {
          return true;
        }

        // If user is manager in space
        if (this.baseAccess._doesContainGuid(this.principal.userInfo.entity.managed_spaces, route.entity.space_guid)) {
          return true;
        }

        // Finally, if user is developer in space
        return this.baseAccess._doesContainGuid(this.principal.userInfo.entity.spaces, route.entity.space_guid);
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

        // If user is manager of org that owns the space
        if (this.baseAccess._doesContainGuid(this.principal.userInfo.entity.managed_organizations,
            route.entity.space.entity.organization_guid)) {
          return true;
        }

        // If user is manager in space
        return this.baseAccess._doesContainGuid(this.principal.userInfo.entity.managed_spaces,
          route.entity.space_guid);
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
