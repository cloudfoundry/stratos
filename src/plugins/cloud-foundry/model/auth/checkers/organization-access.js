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
     * @param {Array} flags feature flags
     * @constructor
     */
    function OrganizationAccess(principal, flags) {
      this.principal = principal;
      this.flags = flags;
      this.baseAccess = modelManager.retrieve('cloud-foundry.model.auth.checkers.baseAccess')(principal);
    }

    angular.extend(OrganizationAccess.prototype, {

      /**
       * @name create
       * @description Does user have create organization permission
       * @returns {boolean}
       */
      create: function () {
         // Users can create organization is they are an admin
        // or the appropriate feature flag is enabled
        return this.principal.isAdmin || this.principal.hasAccessTo('user_org_creation');
      },

      /**
       * @name update
       * @description Does user have update organization permission
       * @returns {boolean}
       */
      delete: function (org) {
        if (this.baseAccess.delete(org)) {
          return true;
        }

        // If user is manager of org
        return this.baseAccess
          ._doesContainGuid(this.principal.userSummary.entity.managed_organizations, org.metadata.guid);
      },

      /**
       * @name delete
       * @description Does user have delete organization permission
       * Original source contained a `//TODO(irfran):` annotation https://jira.hpcloud.net/browse/TEAMFOUR-625
       * @param {Object} org - Application detail
       * @returns {boolean}
       */

      update: function (org) {

        if (this.baseAccess.update(org)) {
          return true;
        }

        // If user is manager of org
        return this.baseAccess
          ._doesContainGuid(this.principal.userSummary.entity.managed_organizations, org.metadata.guid);
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
