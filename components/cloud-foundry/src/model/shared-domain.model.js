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

  function registerSharedDomainModel(modelManager, apiManager, modelUtils) {
    modelManager.register('cloud-foundry.model.shared-domain', new SharedDomain(apiManager, modelUtils));
  }

  /**
   * @memberOf cloud-foundry.model
   * @name SharedDomain
   * @param {app.api.apiManager} apiManager - the shared-domain API manager
   * @param {cloud-foundry.model.modelUtils} modelUtils - a service containing general hcf model helpers
   * @property {app.api.apiManager} apiManager - the shared-domain API manager
   * @property {cloud-foundry.model.modelUtils} modelUtils - service containing general hcf model helpers
   * @class
   */
  function SharedDomain(apiManager, modelUtils) {

    var model = {
      listAllSharedDomains: listAllSharedDomains
    };

    return model;

    /**
     * @function listAllSharedDomains
     * @memberof cloud-foundry.model.private-domain
     * @description list all shared domains
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {object=} params - optional parameters
     * @param {boolean=} paginate - true to return the original possibly paginated list, otherwise a de-paginated list
     * containing ALL results will be returned. This could mean more than one http request is made.
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    function listAllSharedDomains(cnsiGuid, params, paginate) {
      return apiManager.retrieve('cloud-foundry.api.SharedDomains')
        .ListAllSharedDomains(modelUtils.makeListParams(params), modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (!paginate) {
            return modelUtils.dePaginate(response.data, modelUtils.makeHttpConfig(cnsiGuid));
          }
          return response.data.resources;
        })
        .then(function (list) {
          _onListAllSharedDomains(cnsiGuid, list);
          return list;
        });
    }

    function _onListAllSharedDomains(cnsiGuid, domains) {
      _.set(model, 'domains.' + cnsiGuid, _.keyBy(domains, 'metadata.guid'));
    }
  }

})();
