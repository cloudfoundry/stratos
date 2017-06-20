(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model.featureFlag
   * @memberof cloud-foundry.model
   * @name service
   * @description Service model
   */
  angular
    .module('cloud-foundry.model')
    .run(registerServiceModel);

  function registerServiceModel(modelManager, apiManager, modelUtils) {
    modelManager.register('cloud-foundry.model.featureFlags', new FeatureFlags(apiManager, modelUtils));
  }

  /**
   * @name FeatureFlags
   * @description Fetches feature flags for a CF
   * @param {object} apiManager - Api Manager
   * @param {cloud-foundry.model.modelUtils} modelUtils - a service containing general cf model helpers
   * @contructor
   * @returns {object}
   */
  function FeatureFlags(apiManager, modelUtils) {

    var featureFlagsApi = apiManager.retrieve('cloud-foundry.api.FeatureFlags');

    var model = {
      featureFlagsByCnsi: {},
      fetch: fetch,
      getFeatureFlagsForCnsi: getFeatureFlagsForCnsi
    };

    return model;

    /**
     * @name fetch
     * @description fetch featureflags
     * @param {Object} cnsiGuid - Cluster Guid
     * @returns {*}
     */
    function fetch(cnsiGuid) {
      return featureFlagsApi.GetAllFeatureFlags({}, modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          // consider using cache
          model.featureFlagsByCnsi[cnsiGuid] = response.data;
          return response.data;
        });
    }

    /**
     * @name getFeatureFlagsForCnsi
     * @description fetch featureflags from cache
     * @param {Object} cnsi - Cluster Guid
     * @returns {*}
     */
    function getFeatureFlagsForCnsi(cnsi) {

      if (model.featureFlagsByCnsi[cnsi]) {
        return model.featureFlagsByCnsi[cnsi];
      } else {
        return fetch(cnsi).then(function () {
          if (model.featureFlagsByCnsi[cnsi]) {
            return model.featureFlagsByCnsi[cnsi];
          } else {
            throw new Error('Unknown cluster ' + cnsi);
          }
        });
      }
    }

  }

})();
