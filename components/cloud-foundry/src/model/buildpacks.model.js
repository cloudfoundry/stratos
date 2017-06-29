(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model.buildPacks
   * @memberof cloud-foundry.model
   * @name service
   * @description Build Packs model
   */
  angular
    .module('cloud-foundry.model')
    .run(registerServiceModel);

  function registerServiceModel(modelManager, apiManager, modelUtils) {
    modelManager.register('cloud-foundry.model.buildPacks', new BuildPacks(apiManager, modelUtils));
  }

  /**
   * @name BuildPacks
   * @description Fetches buildpack metadata for a CF
   * @param {object} apiManager - Api Manager
   * @param {cloud-foundry.model.modelUtils} modelUtils - a service containing general cf model helpers
   * @returns {object}
   */
  function BuildPacks(apiManager, modelUtils) {

    var buildPacksApi = apiManager.retrieve('cloud-foundry.api.Buildpacks');

    var model = {
      buildPacksByCnsi: {},
      fetch: fetch
    };

    return model;

    /**
     * @name fetch
     * @description fetch buildpack metadata
     * @param {Object} cnsiGuid - Cluster Guid
     * @returns {*}
     */
    function fetch(cnsiGuid) {
      return buildPacksApi.ListAllBuildpacks({}, modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          model.buildPacksByCnsi[cnsiGuid] = response.data ? response.data.resources : undefined;
          return model.buildPacksByCnsi[cnsiGuid];
        });
    }
  }

})();
