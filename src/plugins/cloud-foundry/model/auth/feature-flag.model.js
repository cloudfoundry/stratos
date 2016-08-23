(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model.featureFlag
   * @memberOf cloud-foundry.model
   * @name service
   * @description Service model
   */
  angular
    .module('cloud-foundry.model')
    .run(registerServiceModel);

  registerServiceModel.$inject = [
    'app.model.modelManager',
    'app.api.apiManager'
  ];

  function registerServiceModel(modelManager, apiManager) {
    modelManager.register('cloud-foundry.model.featureFlags', new FeatureFlags(apiManager));
  }

  function FeatureFlags(apiManager) {

    this.featureFlagsApi = apiManager.retrieve('cloud-foundry.api.FeatureFlags');
    this.featureFlagsByCnsi = {};
  }

  angular.extend(FeatureFlags.prototype, {

    fetch: function (cnsiGuid) {

      var that = this;
      var httpConfig = {
        headers: {
          'x-cnap-cnsi-list': cnsiGuid,
          'x-cnap-passthrough': 'true'
        }
      };
      return this.featureFlagsApi.GetAllFeatureFlags({}, httpConfig)
        .then(function (response) {
          // consider using cache
          that.featureFlagsByCnsi[cnsiGuid] = response.data;
          return response.data;
        });
    },

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
