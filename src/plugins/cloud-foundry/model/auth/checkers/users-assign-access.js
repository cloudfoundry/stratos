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

  register.$inject = [
    'modelManager'
  ];

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
      this.principal = principal;
      this.baseAccess = modelManager.retrieve('cloud-foundry.model.auth.checkers.baseAccess')(principal);
    }

    angular.extend(UsersAssignmentAccess.prototype, {

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
      update: function (spaceGuid, orgGuid, isSpace) {

        // Admin
        if (this.baseAccess.update(spaceGuid)) {
          return true;
        }

        if (isSpace) {
          // Check if user is space manager or org manager
          return this.baseAccess
            ._doesContainGuid(this.principal.userSummary.spaces.managed, spaceGuid) ||
            this.baseAccess
              ._doesContainGuid(this.principal.userSummary.organizations.managed, orgGuid);
        } else {
          // check if user is org manager
          return this.baseAccess
            ._doesContainGuid(this.principal.userSummary.organizations.managed, orgGuid);
        }

      },

       /**
       * @name canHandle
       * @description Specifies that this ACL checker can handle `application` permission
       * @param {String} resource - string specifying resource
       * @returns {boolean}
       */
      canHandle: function (resource) {
        return resource === 'user';
      }
    });

    return UsersAssignmentAccess;
  }

})();
