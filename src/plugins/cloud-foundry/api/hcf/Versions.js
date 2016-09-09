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

   /*
    * List Versions for an Application
    * For detailed information, see online documentation at:
    * https://github.com/hpcloud/hcf-versions/blob/develop/swagger-spec/hcf-versions.yml
    */
    ListVersions: function (guid, params, httpConfigOptions) {
      var config = {};
      config.params = params;
      config.url = '/pp/v1/proxy/v1/apps/' + guid + '/droplets';
      config.method = 'GET';

      for (var option in httpConfigOptions) {
        if (!httpConfigOptions.hasOwnProperty(option)) { continue; }
        config[option] = httpConfigOptions[option];
      }
      config.headers = config.headers || {};
      config.headers['x-cnap-api-host'] = 'hcf-versions-api';
      return this.$http(config);
    },

   /*
    * Rollback the Version for an Application to a pervious one
    * For detailed information, see online documentation at:
    * https://github.com/hpcloud/hcf-versions/blob/develop/swagger-spec/hcf-versions.yml
    */
    Rollback: function (guid, params, httpConfigOptions) {
      var config = {};
      config.params = params;
      config.url = '/pp/v1/proxy/v1/apps/' + guid + '/droplets/current';
      config.method = 'PUT';

      for (var option in httpConfigOptions) {
        if (!httpConfigOptions.hasOwnProperty(option)) { continue; }
        config[option] = httpConfigOptions[option];
      }
      config.headers = config.headers || {};
      config.headers['x-cnap-api'] = 'hcf-versions-api';
      return this.$http(config);
    }
  });
  /* eslint-enable camelcase */

})();
