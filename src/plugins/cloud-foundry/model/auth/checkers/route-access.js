(function() {
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


  function RouteAccessFactory(modelManager) {

    function RouteAccess(principal, flags) {
      this.principal = principal;
      this.flags = flags;
      this.baseAccess = modelManager.retrieve('cloud-foundry.model.auth.checkers.baseAccess')(principal);

    }

    angular.extend(RouteAccess.prototype, {
      create: function(space) {

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

      update: function(route) {
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

      delete: function(route) {
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

      canHandle: function(resource) {
        return resource === 'route';
      }
    });

    return RouteAccess;
  }


})();
