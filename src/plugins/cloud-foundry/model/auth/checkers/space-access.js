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
          this.baseAccess._doesContainGuid(this.principal.userSummary.entity.managed_organizations, org.metadata.guid);
      },

      /**
       * @name update
       * @description Does user have update space permission
       * @returns {boolean}
       */
      delete: function () {
        return  this.principal.isAdmin ||
          this.baseAccess._doesContainGuid(this.principal.userSummary.entity.managed_organizations, org.metadata.guid);
      },

      /**
       * @name delete
       * @description Does user have delete organization permission
       * @param {Object} org - Application detail
       * @returns {boolean}
       */

      update: function (org) {
        if (this.baseAccess.update(org)) {
          return true;
        }

        // If user is manager of org
        return this.baseAccess._doesContainGuid(this.principal.userSummary.entity.managed_organizations, org.metadata.guid);
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
