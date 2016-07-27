(function () {
  'use strict';

  angular
    .module('cloud-foundry.api')
    .run(registerApi);

  registerApi.$inject = [
    '$http',
    'app.api.apiManager'
  ];

  function registerApi($http, apiManager) {
    apiManager.register('cloud-foundry.api.HceInfoApi', new HceInfoApi($http));
  }

  /**
    * @constructor
    * @name HceInfoApi
    * @description Returns the response to the HCE's /info API
    * @param {object} $http - the Angular $http service
    * @property {object} $http - the Angular $http service
    * @property {string} baseUrl - the API base URL
    */
  function HceInfoApi($http) {
    this.$http = $http;
    this.baseUrl = '/pp/v1/proxy/info';
  }

  angular.extend(HceInfoApi.prototype, {
    /**
     * @name info
     * @description Get the info for an HCE instance
     * @param {string} guid - the HCE instance GUID
     * @param {object} httpConfigOptions - additional config options
     * @returns {promise} A resolved/rejected promise
     */
    info: function (guid, httpConfigOptions) {
      var path = this.baseUrl;
      var headers = {
        'x-cnap-cnsi-list': guid
      };

      var config = {
        method: 'GET',
        url: path,
        params: {},
        headers: headers
      };

      angular.forEach(httpConfigOptions, function (optionConfig, option) {
        if (option === 'headers') {
          angular.extend(config[option], optionConfig);
        } else {
          config[option] = optionConfig;
        }
      });

      return this.$http(config).then(function (response) {
        return response.data;
      });
    }
  });
})();
