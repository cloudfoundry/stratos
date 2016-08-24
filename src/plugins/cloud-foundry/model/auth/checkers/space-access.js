(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model
   * @memberOf cloud-foundry.model
   * @name OrganizationAccess
   * @description CF ACL Model
   */
  angular
    .module('cloud-foundry.model')
    .run(register);

  register.$inject = [
    'app.model.modelManager'
  ];

  function register(modelManager) {
    modelManager.register('cloud-foundry.model.auth.checkers.spaceAccess',
      SpaceAccessFactory(modelManager));
  }

  /**
   * @name SpaceAccessFactory
   * @description Function to return an SpaceAccess class
   * @param {app.api.modelManager} modelManager - the Model management service
   * @returns {OrganizationAccess}
   */
  function SpaceAccessFactory(modelManager) {
    /**
     * @name SpaceAccess
     * @description Constructor for SpaceAccess
     * @param {Principal} principal Principal instance
     * @param {Array} flags feature flags
     * @constructor
     */
    function SpaceAccess(principal, flags) {
      this.principal = principal;
      this.flags = flags;
      this.baseAccess = modelManager.retrieve('cloud-foundry.model.auth.checkers.baseAccess')(principal);
    }

    angular.extend(SpaceAccess.prototype, {

      /**
       * @name create
       * @description Does user have create space permission.
       * A
       * @returns {boolean}
       */
      create: function (org) {
        return this.principal.isAdmin ||
          this.baseAccess._doesContainGuid(this.principal.userSummary.organizations.managed, org.metadata.guid);
      },

      /**
       * @name delete
       * @description User can delete space if:
       * 1. user is an admin
       * 2. user is the org manager
       * 3. user is the space manager
       * @returns {boolean}
       */
      delete: function (org) {
        return this.principal.isAdmin ||
          this.baseAccess._doesContainGuid(this.principal.userSummary.organizations.managed, org.metadata.guid);
      },

      /**
       * @name delete
       * @description Does user have delete organization permission
       * @param {Object} org - Application detail
       * @returns {boolean}
       */

      update: function (space) {
        if (this.baseAccess.update(space)) {
          return true;
        }

        // If user is manager of org
        this.baseAccess._doesContainGuid(this.principal.userSummary.organizations.managed, org.metadata.guid);
      },

      /**
       * @name rename
       * @description A user can rename space, if either of the following are true
       * 1. User is admin
       * 2. User is an Org Manager
       * 3. User is a Space Manager
       * 4. User is a Space Developer
       * @param {Object} org - Application detail
       * @returns {boolean}
       */

      rename: function (space) {

        return this.principal.isAdmin ||
          // User is Org manager
          this.baseAccess._doesContainGuid(this.principal.userSummary.organizations.managed, space.entity.organization_guid) ||
          // User is Space manager
          this.baseAccess._doesContainGuid(this.principal.userSummary.spaces.managed, space.metadata.guid) ||
          // User is Space developer
          this.baseAccess._doesContainGuid(this.principal.userSummary.spaces.all, space.metadata.guid);
      },

      /**
       * @name canHandle
       * @description Specifies that this ACL checker can handle `application` permission
       * @param {String} resource - string specifying resource
       * @returns {boolean}
       */
      canHandle: function (resource) {
        return resource === 'space';
      }
    });

    return SpaceAccess;
  }

})();
