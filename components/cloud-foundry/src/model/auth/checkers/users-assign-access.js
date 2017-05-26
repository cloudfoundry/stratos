(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model.UsersAssignmentAccess
   * @memberof cloud-foundry.model
   * @name UsersAssignmentAccess
   * @description CF ACL Model
   */
  angular
    .module('cloud-foundry.model')
    .run(register);

  function register(modelManager) {
    modelManager.register('cloud-foundry.model.auth.checkers.usersAssignmentAccess',
      UsersAssignmentAccessFactory(modelManager));
  }

  /**
   * @name UsersAssignmentAccessFactory
   * @description Function to return an OrganizationAccess class
   * @param {app.api.modelManager} modelManager - the Model management service
   * @returns {OrganizationAccess}
   */
  function UsersAssignmentAccessFactory(modelManager) {
    /**
     * @name OrganizationAccess
     * @description Constructor for OrganizationAccess
     * @param {Principal} principal Principal instance
     * @constructor
     */
    function UsersAssignmentAccess(principal) {
      var baseAccess = modelManager.retrieve('cloud-foundry.model.auth.checkers.baseAccess')(principal);

      return {
        update: update,
        canHandle: canHandle
      };

      /**
       * @name updateSpaces
       * @description User can update role assignments if:
       * 1. User is admin
       * 2. User is an organisation manager
       * 3. User is a space manager  (in case its a space)
       * @param {Object} spaceGuid - Space GUID
       * @param {Object} orgGuid - Organization GUID
       * @param {boolean} isSpace - flag to indicate what object is
       * @returns {boolean}
       */
      function update(spaceGuid, orgGuid, isSpace) {

        // Admin
        if (baseAccess.update(spaceGuid)) {
          return true;
        }

        if (isSpace) {
          // Check if user is space manager or org manager
          return baseAccess._doesContainGuid(principal.userSummary.spaces.managed, spaceGuid) ||
            baseAccess._doesContainGuid(principal.userSummary.organizations.managed, orgGuid);
        } else {
          // check if user is org manager
          return baseAccess._doesContainGuid(principal.userSummary.organizations.managed, orgGuid);
        }

      }

      /**
       * @name canHandle
       * @description Specifies that this ACL checker can handle `application` permission
       * @param {String} resource - string specifying resource
       * @returns {boolean}
       */
      function canHandle(resource) {
        return resource === 'user';
      }
    }

    return UsersAssignmentAccess;
  }

})();
