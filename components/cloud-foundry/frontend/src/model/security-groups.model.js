(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model.shared-domain
   * @memberOf cloud-foundry.model
   * @description SharedDomain model
   */
  angular
    .module('cloud-foundry.model')
    .run(registerSecurityGroupsModel);

  function registerSecurityGroupsModel(modelManager, apiManager, modelUtils) {
    modelManager.register('cloud-foundry.model.security-groups', new SecurityGroups(apiManager, modelUtils));
  }

  /**
   * @memberOf cloud-foundry.model
   * @name SharedDomain
   * @param {app.api.apiManager} apiManager - the shared-domain API manager
   * @param {cloud-foundry.model.modelUtils} modelUtils - a service containing general cf model helpers
   * @property {app.api.apiManager} apiManager - the shared-domain API manager
   * @property {cloud-foundry.model.modelUtils} modelUtils - service containing general cf model helpers
   * @class
   */
  function SecurityGroups(apiManager, modelUtils) {

    var model = {
      listAllSecurityGroups: listAllSecurityGroups
    };

    return model;

    /**
     * @function listAllSecurityGroups
     * @description list all security groups
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {object=} params - optional parameters
     * @param {boolean=} paginate - true to return the original possibly paginated list, otherwise a de-paginated list
     * containing ALL results will be returned. This could mean more than one http request is made.
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    function listAllSecurityGroups(cnsiGuid, params, paginate) {
      // Get the space details for each of the security groups
      params = params || {};
      params['inline-relations-depth'] = 1;

      return apiManager.retrieve('cloud-foundry.api.SecurityGroups')
        .ListAllSecurityGroups(modelUtils.makeListParams(params), modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (!paginate) {
            return modelUtils.dePaginate(response.data, modelUtils.makeHttpConfig(cnsiGuid));
          }
          return response.data.resources;
        })
        .then(function (list) {
          _onListAllListAllSecurityGroups(cnsiGuid, list);
          return list;
        });
    }

    function _onListAllListAllSecurityGroups(cnsiGuid, domains) {
      _.set(model, 'securityGroups.' + cnsiGuid, _.keyBy(domains, 'metadata.guid'));
    }
  }
})();
