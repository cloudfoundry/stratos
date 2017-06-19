(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model
   * @description Build pack model
   */
  angular
    .module('cloud-foundry.model')
    .run(registerBuildPackModel);

  function registerBuildPackModel(modelManager, apiManager, modelUtils) {
    modelManager.register('cloud-foundry.model.build-pack', new BuildPack(apiManager, modelUtils));
  }

  /**
   * @memberof cloud-foundry.model
   * @name BuildPack
   * @param {app.api.apiManager} apiManager - the API manager
   * @param {cloud-foundry.model.modelUtils} modelUtils - a service containing general cf model helpers
   * @property {app.api.apiManager} apiManager - the API manager
   * @property {cloud-foundry.model.modelUtils} modelUtils - service containing general cf model helpers
   * @property {object} route - the currently selected route state
   * @class
   */
  function BuildPack(apiManager, modelUtils) {

    var model = {
      buildPacks: {},
      listAllBuildPacks: listAllBuildPacks
    };

    return model;

    /**
     * @function listAllAppsForRoute
     * @memberof cloud-foundry.model.route
     * @description lists all apps for the route and store the response in the model
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {object=} params - optional parameters
     * @param {boolean=} paginate - true to return the original possibly paginated list, otherwise a de-paginated list
     * containing ALL results will be returned. This could mean more than one http request is made.
     * @returns {object} A resolved/rejected promise
     * @public
     */
    function listAllBuildPacks(cnsiGuid, params, paginate) {
      return apiManager.retrieve('cloud-foundry.api.Buildpacks')
        .ListAllBuildpacks(params, modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (paginate) {
            return response.data;
          }
          return modelUtils.dePaginate(response.data, modelUtils.makeHttpConfig(cnsiGuid))
            .then(function (list) {
              return {
                total_pages: 1,
                total_results: list.length,
                prev_url: null,
                next_url: null,
                resources: list
              };
            });
        })
        .then(function (responseData) {
          model.buildPacks = responseData;
          return responseData;
        });
    }
  }
})();
