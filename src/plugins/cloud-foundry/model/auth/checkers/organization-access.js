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
    'app.model.modelManager'
  ];

  function register(modelManager) {
    modelManager.register('cloud-foundry.model.auth.checkers.organizationAccess',
      OrganizationAccessFactory(modelManager));
  }

  /**
   * @name OrganizationAccessFactory
   * @description Function to return an OrganizationAccess class
   * @param {app.api.modelManager} modelManager - the Model management service
   * @returns {OrganizationAccess}
   */
  function OrganizationAccessFactory(modelManager) {
    /**
     * @name OrganizationAccess
     * @description Constructor for OrganizationAccess
     * @param {Principal} principal Principal instance
     * @constructor
     */
    function OrganizationAccess(principal) {
      this.principal = principal;
      this.baseAccess = modelManager.retrieve('cloud-foundry.model.auth.checkers.baseAccess')(principal);
    }

    angular.extend(OrganizationAccess.prototype, {

      /**
       * @name create
       * @description Users can create an organisation if:
       * 1. User is and admin
       * 2. the `user_org_creation` feature flag is enabled
       * @returns {boolean}
       */
      create: function () {

        // Admin
        if (this.baseAccess.create()) {
          return true;
        }

        return this.principal.hasAccessTo('user_org_creation');

      },

      /**
       * @name delete
       * @description Users can delete an organisation if:
       * 1. User is and admin
       * 2. is Org Manager
       * @param {object} orgGuid - organisation GUID
       * @returns {boolean}
       */
      delete: function (orgGuid) {

        // Admin
        if (this.baseAccess.delete(orgGuid)) {
          return true;
        }

        // If user is manager of org
        return this.baseAccess
          ._doesContainGuid(this.principal.userSummary.organizations.managed, orgGuid);
      },

      /**
       * @name update
       * @description Users can update an organisation if:
       * 1. User is and admin
       * 2. is Org Manager
       * @param {object} orgGuid - organisation GUID
       * @returns {boolean}
       */

      update: function (orgGuid) {

        // User is an admin
        if (this.baseAccess.update(orgGuid)) {
          return true;
        }

        // If user is manager of org
        return this.baseAccess
          ._doesContainGuid(this.principal.userSummary.organizations.managed, orgGuid);
      },

      /**
       * @name canHandle
       * @description Specifies that this ACL checker can handle `application` permission
       * @param {String} resource - string specifying resource
       * @returns {boolean}
       */
      canHandle: function (resource) {
        return resource === 'organization';
      }
    });

    return OrganizationAccess;
  }

})();
