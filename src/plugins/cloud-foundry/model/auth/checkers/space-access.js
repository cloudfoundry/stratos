(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model.OrganizationAccess
   * @memberof cloud-foundry.model
   * @name OrganizationAccess
   * @description CF ACL Model
   */
  angular
    .module('cloud-foundry.model')
    .run(register);

  register.$inject = [
    'modelManager'
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
     * @constructor
     */
    function SpaceAccess(principal) {
      this.principal = principal;
      this.baseAccess = modelManager.retrieve('cloud-foundry.model.auth.checkers.baseAccess')(principal);
    }

    angular.extend(SpaceAccess.prototype, {

      /**
       * @name create
       * @description User can create a space if:
       * 1. User is an Admin
       * 2. User is an Org Manager
       * @param {Object} orgGuid - org GUID
       * @returns {boolean}
       */
      create: function (orgGuid) {
        // Admin
        if (this.baseAccess.create(orgGuid)) {
          return true;
        }

        return this.baseAccess._doesContainGuid(this.principal.userSummary.organizations.managed, orgGuid);
      },

      /**
       * @name delete
       * @description User can delete space if:
       * 1. user is an admin
       * 2. user is the org manager
       * @param {Object} orgGuid - Organization GUID
       * @returns {boolean}
       */
      delete: function (orgGuid) {
        // Admin
        if (this.baseAccess.create(orgGuid)) {
          return true;
        }

        return this.baseAccess._doesContainGuid(this.principal.userSummary.organizations.managed, orgGuid);
      },

      /**
       * @name update
       * @description User can update a space if:
       * 1. User is an admin
       * 2. User is org manager
       * 3. user is space manager
       * @param {Object} spaceGuid - Space GUID
       * @param {Object} orgGuid - Organization GUID
       * @returns {boolean}
       */

      update: function (spaceGuid, orgGuid) {
        // Admin
        if (this.baseAccess.update(spaceGuid)) {
          return true;
        }

        return this.baseAccess._doesContainGuid(this.principal.userSummary.organizations.managed, orgGuid) ||
          this.baseAccess._doesContainGuid(this.principal.userSummary.spaces.managed, spaceGuid);
      },

      /**
       * @name rename
       * @description A user can rename space, if either of the following are true
       * 1. User is admin
       * 2. User is an Org Manager
       * 3. User is a Space Manager
       * @param {Object} spaceGuid - Space GUID
       * @param {Object} orgGuid - Organization GUID
       * @returns {boolean}
       */

      rename: function (spaceGuid, orgGuid) {

        // Admin
        if (this.baseAccess.update(spaceGuid)) {
          return true;
        }

        // User is Org manager
        return this.baseAccess._doesContainGuid(this.principal.userSummary.organizations.managed, orgGuid) ||
          // User is Space manager
          this.baseAccess._doesContainGuid(this.principal.userSummary.spaces.managed, spaceGuid);
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
