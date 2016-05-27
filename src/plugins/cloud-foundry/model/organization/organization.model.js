(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model
   * @description Organization model
   */
  angular
    .module('cloud-foundry.model')
    .run(registerRouteModel);

  registerRouteModel.$inject = [
    'app.model.modelManager',
    'app.api.apiManager'
  ];

  function registerRouteModel(modelManager, apiManager) {
    modelManager.register('cloud-foundry.model.organization', new Organization(apiManager));
  }

  /**
   * @memberof cloud-foundry.model
   * @name Organization
   * @param {app.api.apiManager} apiManager - the API manager
   * @property {app.api.apiManager} apiManager - the API manager
   * @class
   */
  function Organization(apiManager) {
    this.apiManager = apiManager;
  }

  angular.extend(Organization.prototype, {
   /**
    * @function listAllOrganizations
    * @memberof cloud-foundry.model.organization
    * @description lists all organizations
    * @param {object} params - optional parameters
    * @returns {promise} A resolved/rejected promise
    * @public
    */
    listAllOrganizations: function (params) {
      return this.apiManager.retrieve('cloud-foundry.api.Organizations')
        .ListAllOrganizations(params)
        .then(function (response) {
          return response.data.resources;
        });
    },

   /**
    * @function listAllSpacesForOrganization
    * @memberof cloud-foundry.model.organization
    * @description lists all spaces for organization
    * @param {string} guid - organization id
    * @param {object} params - optional parameters
    * @returns {promise} A resolved/rejected promise
    * @public
    */
    listAllSpacesForOrganization: function (guid, params) {
      return this.apiManager.retrieve('cloud-foundry.api.Organizations')
        .ListAllSpacesForOrganization(guid, params)
        .then(function (response) {
          return response.data.resources;
        });
    }
  });

})();
