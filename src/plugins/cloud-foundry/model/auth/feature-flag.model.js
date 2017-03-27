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

  registerServiceModel.$inject = [
    'modelManager',
    'apiManager',
    'modelUtils'
  ];

  function registerServiceModel(modelManager, apiManager, modelUtils) {
    modelManager.register('cloud-foundry.model.featureFlags', new FeatureFlags(apiManager, modelUtils));
  }

  /**
   * @name FeatureFlags
   * @description Fetches feature flags for a CF
   * @param {object} apiManager - Api Manager
   * @param {cloud-foundry.model.modelUtils} modelUtils - a service containing general hcf model helpers
   * @property {object}featureFlagsByCnsi - Feature flag cache
   * @property {cloud-foundry.model.modelUtils} modelUtils - service containing general hcf model helpers
   * @contructor
   */
  function FeatureFlags(apiManager, modelUtils) {

    this.featureFlagsApi = apiManager.retrieve('cloud-foundry.api.FeatureFlags');
    this.featureFlagsByCnsi = {};
    this.modelUtils = modelUtils;
  }

  angular.extend(FeatureFlags.prototype, {

    /**
     * @name fetch
     * @description fetch featureflags
     * @param {Object} cnsiGuid - Cluster Guid
     * @returns {*}
     */
    fetch: function (cnsiGuid) {

      var that = this;
      return this.featureFlagsApi.GetAllFeatureFlags({}, this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          // consider using cache
          that.featureFlagsByCnsi[cnsiGuid] = response.data;
          return response.data;
        });
    },

    /**
     * @name getFeatureFlagsForCnsi
     * @description fetch featureflags from cache
     * @param {Object} cnsi - Cluster Guid
     * @returns {*}
     */
    getFeatureFlagsForCnsi: function (cnsi) {

      if (this.featureFlagsByCnsi[cnsi]) {
        return featureFlagService[cnsi];
      } else {
        return fetch().then(function () {
          if (featureFlagService[cnsi]) {
            return featureFlagService[cnsi];
          } else {
            throw new Error('Unknown cluster ' + cnsi);
          }
        });
      }
    }

  });

})();
