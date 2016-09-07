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
    'app.api.apiManager',
    'cloud-foundry.model.modelUtils'
  ];

  function registerPrivateDomainModel(modelManager, apiManager, modelUtils) {
    modelManager.register('cloud-foundry.model.private-domain', new PrivateDomain(apiManager, modelUtils));
  }

  /**
   * @memberOf cloud-foundry.model
   * @name PrivateDomain
   * @param {app.api.apiManager} apiManager - the private-domain API manager
   * @param {cloud-foundry.model.modelUtils} modelUtils - a service containing general hcf model helpers
   * @property {app.api.apiManager} apiManager - the private-domain API manager
   * @property {cloud-foundry.model.modelUtils} modelUtils - service containing general hcf model helpers
   * @class
   */
  function PrivateDomain(apiManager, modelUtils) {
    this.apiManager = apiManager;
    this.modelUtils = modelUtils;
  }

  angular.extend(PrivateDomain.prototype, {
    /**
     * @function listAllPrivateDomains
     * @memberof cloud-foundry.model.private-domain
     * @description list all private domains
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {object=} params - optional parameters
     * @param {boolean=} dePaginate - true to return the entire collection, not just the first page of the list request
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    listAllPrivateDomains: function (cnsiGuid, params, dePaginate) {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.PrivateDomains')
        .ListAllPrivateDomains(this.modelUtils.makeListParams(params), this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (dePaginate) {
            return that.modelUtils.dePaginate(response.data, that.modelUtils.makeHttpConfig(cnsiGuid));
          }
          return response.data.resources;
        })
        .then(function (domains) {
          that.onListAllPrivateDomains(cnsiGuid, domains);
          return domains;
        });
    },

    onListAllPrivateDomains: function (cnsiGuid, domains) {
      _.set(this, 'domains.' + cnsiGuid, _.keyBy(domains, 'metadata.guid'));
    }
  });

})();
