(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model.private-domain
   * @memberOf cloud-foundry.model
   * @description PrivateDomain model
   */
  angular
    .module('cloud-foundry.model')
    .run(registerPrivateDomainModel);

  registerPrivateDomainModel.$inject = [
    'app.model.modelManager',
    'app.api.apiManager'
  ];

  function registerPrivateDomainModel(modelManager, apiManager) {
    modelManager.register('cloud-foundry.model.private-domain', new PrivateDomain(apiManager));
  }

  /**
   * @memberOf cloud-foundry.model
   * @name PrivateDomain
   * @param {app.api.apiManager} apiManager - the private-domain API manager
   * @property {app.api.apiManager} apiManager - the private-domain API manager
   * @class
   */
  function PrivateDomain(apiManager) {
    this.apiManager = apiManager;
  }

  angular.extend(PrivateDomain.prototype, {
    /**
     * @function listAllPrivateDomains
     * @memberof cloud-foundry.model.private-domain
     * @description list all private domains
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {object} params - optional parameters
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    listAllPrivateDomains: function (cnsiGuid, params) {
      var httpConfig = {
        headers: { 'x-cnap-cnsi-list': cnsiGuid }
      };
      return this.apiManager.retrieve('cloud-foundry.api.PrivateDomains')
        .ListAllPrivateDomains(params, httpConfig)
        .then(function (response) {
          return response.data[cnsiGuid].resources;
        });
    }
  });

})();
