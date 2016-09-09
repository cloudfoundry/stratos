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
    apiManager.register('cloud-foundry.api.Versions', new VersionsApi($http));
  }

  function VersionsApi($http) {
    this.$http = $http;
  }

  /* eslint-disable camelcase */
  angular.extend(VersionsApi.prototype, {


    /**
     * Helper method to make the request config for $http
     */
    _makeConfig: function(params, httpConfigOptions) {
      var config = {};
      config.params = params;
      for (var option in httpConfigOptions) {
        if (!httpConfigOptions.hasOwnProperty(option)) { continue; }
        config[option] = httpConfigOptions[option];
      }
      config.headers = config.headers || {};
      config.headers['x-cnap-api-host'] = 'hcf-versions-api';
      return config;
    },

   /*
    * List Versions for an Application
    * For detailed information, see online documentation at:
    * https://github.com/hpcloud/hcf-versions/blob/develop/swagger-spec/hcf-versions.yml
    */
    ListVersions: function (guid, params, httpConfigOptions) {
      var config = this._makeConfig(params, httpConfigOptions);
      config.url = '/pp/v1/proxy/v1/apps/' + guid + '/droplets';
      config.method = 'GET';
      return this.$http(config);
    },

   /*
    * Rollback the Version for an Application to a pervious one
    * For detailed information, see online documentation at:
    * https://github.com/hpcloud/hcf-versions/blob/develop/swagger-spec/hcf-versions.yml
    */
    Rollback: function (guid, params, httpConfigOptions) {
      var config = this._makeConfig(params, httpConfigOptions);
      config.url = '/pp/v1/proxy/v1/apps/' + guid + '/droplets/current';
      config.method = 'PUT';
      return this.$http(config);
    }
  });
  /* eslint-enable camelcase */

})();
