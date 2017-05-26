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

    var model = {
      listAllPrivateDomains: listAllPrivateDomains
    };

    return model;

    /**
     * @function listAllPrivateDomains
     * @memberof cloud-foundry.model.private-domain
     * @description list all private domains
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {object=} params - optional parameters
     * @param {boolean=} paginate - true to return the original possibly paginated list, otherwise a de-paginated list
     * containing ALL results will be returned. This could mean more than one http request is made.
     * @returns {promise} A promise which will be resolved with the list
     * @public
     */
    function listAllPrivateDomains(cnsiGuid, params, paginate) {
      return apiManager.retrieve('cloud-foundry.api.PrivateDomains')
        .ListAllPrivateDomains(modelUtils.makeListParams(params), modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (!paginate) {
            return modelUtils.dePaginate(response.data, modelUtils.makeHttpConfig(cnsiGuid));
          }
          return response.data.resources;
        })
        .then(function (domains) {
          _onListAllPrivateDomains(cnsiGuid, domains);
          return domains;
        });
    }

    function _onListAllPrivateDomains(cnsiGuid, domains) {
      _.set(model, 'domains.' + cnsiGuid, _.keyBy(domains, 'metadata.guid'));
    }
  }

})();
