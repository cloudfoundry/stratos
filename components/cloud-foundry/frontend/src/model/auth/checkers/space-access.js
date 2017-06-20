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
      var baseAccess = modelManager.retrieve('cloud-foundry.model.auth.checkers.baseAccess')(principal);

      return {
        create: create,
        update: update,
        rename: rename,
        delete: deleteResource,
        canHandle: canHandle
      };

      /**
       * @name create
       * @description User can create a space if:
       * 1. User is an Admin
       * 2. User is an Org Manager
       * @param {Object} orgGuid - org GUID
       * @returns {boolean}
       */
      function create(orgGuid) {
        // Admin
        if (baseAccess.create(orgGuid)) {
          return true;
        }

        return baseAccess._doesContainGuid(principal.userSummary.organizations.managed, orgGuid);
      }

      /**
       * @name delete
       * @description User can delete space if:
       * 1. user is an admin
       * 2. user is the org manager
       * @param {Object} orgGuid - Organization GUID
       * @returns {boolean}
       */
      function deleteResource(orgGuid) {
        // Admin
        if (baseAccess.create(orgGuid)) {
          return true;
        }

        return baseAccess._doesContainGuid(principal.userSummary.organizations.managed, orgGuid);
      }
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

      function update(spaceGuid, orgGuid) {
        // Admin
        if (baseAccess.update(spaceGuid)) {
          return true;
        }

        return baseAccess._doesContainGuid(principal.userSummary.organizations.managed, orgGuid) ||
          baseAccess._doesContainGuid(principal.userSummary.spaces.managed, spaceGuid);
      }

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

      function rename(spaceGuid, orgGuid) {

        // Admin
        if (baseAccess.update(spaceGuid)) {
          return true;
        }

        // User is Org manager
        return baseAccess._doesContainGuid(principal.userSummary.organizations.managed, orgGuid) ||
          // User is Space manager
          baseAccess._doesContainGuid(principal.userSummary.spaces.managed, spaceGuid);
      }

      /**
       * @name canHandle
       * @description Specifies that this ACL checker can handle `application` permission
       * @param {String} resource - string specifying resource
       * @returns {boolean}
       */
      function canHandle(resource) {
        return resource === 'space';
      }
    }

    return SpaceAccess;
  }

})();
