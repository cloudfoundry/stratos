(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model
   * @memberOf cloud-foundry.model
   * @name UsersAssignmentAccess
   * @description CF ACL Model
   */
  angular
    .module('cloud-foundry.model')
    .run(register);

  register.$inject = [
    'app.model.modelManager'
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
     * @param {Array} flags feature flags
     * @constructor
     */
    function UsersAssignmentAccess(principal, flags) {
      this.principal = principal;
      this.flags = flags;
      this.baseAccess = modelManager.retrieve('cloud-foundry.model.auth.checkers.baseAccess')(principal);
    }

    angular.extend(UsersAssignmentAccess.prototype, {

      /**
       * @name updateSpaces
       * @description User can update role assignments if:
       * 1. User is admin
       * 2. User is an organisation manager
       * 3. User is a space manager  (in case its a space)
       * @returns {boolean}
       */

      update: function (object, isSpace) {

        if (this.baseAccess.update(object)) {
          return true;
        }

        // If user is manager of org
        if (isSpace) {
          return this.baseAccess
            ._doesContainGuid(this.principal.userSummary.spaces.managed, object.metadata.guid);
        } else {
          return this.baseAccess
            ._doesContainGuid(this.principal.userSummary.organizations.managed, object.metadata.guid);
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
