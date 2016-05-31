(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model.shared-domain
   * @memberOf cloud-foundry.model
   * @description SharedDomain model
   */
  angular
    .module('cloud-foundry.model')
    .run(registerSharedDomainModel);

  registerSharedDomainModel.$inject = [
    'app.model.modelManager',
    'app.api.apiManager'
  ];

  function registerSharedDomainModel(modelManager, apiManager) {
    modelManager.register('cloud-foundry.model.shared-domain', new SharedDomain(apiManager));
  }

  /**
   * @memberOf cloud-foundry.model
   * @name SharedDomain
   * @param {app.api.apiManager} apiManager - the shared-domain API manager
   * @property {app.api.apiManager} apiManager - the shared-domain API manager
   * @class
   */
  function SharedDomain(apiManager) {
    this.apiManager = apiManager;
  }

  angular.extend(SharedDomain.prototype, {
    /**
     * @function listAllSharedDomains
     * @memberof cloud-foundry.model.private-domain
     * @description list all shared domains
     * @param {object} params - optional parameters
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    listAllSharedDomains: function (cnsiGuid, params) {
      var httpConfig = {
        headers: { 'x-cnap-cnsi-list': cnsiGuid }
      };
      return this.apiManager.retrieve('cloud-foundry.api.SharedDomains')
        .ListAllSharedDomains(params, httpConfig)
        .then(function (response) {
          return response.data[cnsiGuid].resources;
        });
    }
  });

})();
