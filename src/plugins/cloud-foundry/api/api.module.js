(function () {
  'use strict';

  angular
    .module('cloud-foundry.api', [], config)
    .run(registerCFApi);

  config.$inject = [
    '$httpProvider'
  ];

  function config($httpProvider) {
    $httpProvider.interceptors.push(CFAPIInterceptor);
  }

  CFAPIInterceptor.$inject = [
    '$q'
  ];

  function CFAPIInterceptor($q) {
    return {
      request: marshalRequest,
      response: marshalResponse
    };

    function makeQueryString(params) {
      params = params || {};

      var query = '';
      var firstQuery = true;

      if (params.queries) {
        _.each(params.queries, function (value, key) {
          query = query + ((firstQuery ? '' : '&') + key + '=' + value);
          firstQuery = false;
        });

        if (params.queries['inline-relations-depth']) {
          query = query + '&orphan-relations=1';
        }
      }

      if (params.filter && params.filter.name) {
        query = query + ((firstQuery ? '' : '&') + 'q=' + params.filter.name + ':' + params.filter.value);
      }

      return query;
    }

    function marshalRequest(config) {
      if (config.url.substr(0,4) === "/v2/") {
        config.paramSerializer = makeQueryString;
      }
      return config || $q.when(config);
    }

    function marshalResponse(response) {
      if (response.config.url.substr(0,4) === "/v2/" && response.config.url.indexOf('orphan-relations=1')) {
        // insert orphan relations back into returned resources
      }
      return response;
    }
  }

  registerCFApi.$inject = [
    '$http',
    'app.api.apiManager',
    'cloud-foundry.api.AppsService'
  ];

  function registerCFApi($http, apiManager, AppsAPI) {

    function CFApi($http) {
      this.$http = $http;
      apiManager.register('cloud-foundry.api.apps', new AppsAPI($http));
    }

    apiManager.register('cloud-foundry.api', new CFApi($http));

  }

})();
