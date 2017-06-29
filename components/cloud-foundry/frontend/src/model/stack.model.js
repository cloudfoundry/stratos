(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model.stack
   * @memberOf cloud-foundry.model
   * @description Stack model
   */
  angular
    .module('cloud-foundry.model')
    .run(registryStacksModel);

  function registryStacksModel(modelManager, apiManager, modelUtils) {
    modelManager.register('cloud-foundry.model.stacks', new Stacks(apiManager, modelUtils));
  }

  /**
   * @memberOf cloud-foundry.model
   * @name Stacks
   * @param {app.api.apiManager} apiManager - the private-domain API manager
   * @param {cloud-foundry.model.modelUtils} modelUtils - a service containing general cf model helpers
   * @property {app.api.apiManager} apiManager - the private-domain API manager
   * @property {cloud-foundry.model.modelUtils} modelUtils - service containing general cf model helpers
   * @class
   */
  function Stacks(apiManager, modelUtils) {
    var model = {
      listAllStacks: listAllStacks
    };

    return model;

    /**
     * @function Stacks
     * @memberof cloud-foundry.model.stack
     * @description list all stacks
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {object=} params - optional parameters
     * containing ALL results will be returned. This could mean more than one http request is made.
     * @param {boolean=} paginate - true to return the original possibly paginated list, otherwise a de-paginated list
     * containing ALL results will be returned. This could mean more than one http request is made.
     * @returns {object} A promise which will be resolved with the list
     * @public
     */
    function listAllStacks(cnsiGuid, params, paginate) {
      return apiManager.retrieve('cloud-foundry.api.Stacks')
        .ListAllStacks(modelUtils.makeListParams(params), modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (!paginate) {
            return modelUtils.dePaginate(response.data, modelUtils.makeHttpConfig(cnsiGuid));
          }
          return response.data.resources;
        })
        .then(function (stacks) {
          onListStacks(cnsiGuid, stacks);
          return stacks;
        });
    }

    /**
     * @function onListStacks
     * @memberof cloud-foundry.model.stacks
     * @description Cache response
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {Array} stacks - array of stacks
     * @returns {Array} The array of stacks
     * @public
     */
    function onListStacks(cnsiGuid, stacks) {
      _.set(model, 'stacks.' + cnsiGuid, _.keyBy(stacks, 'metadata.guid'));
      return stacks;
    }

  }

})();
