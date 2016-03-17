(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.api
   * @memberof cloud-foundry
   * @name api
   * @description The API layer of the CF platform that handles HTTP requests
   */
  angular
    .module('cloud-foundry.api', [], config);

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
      if (config.url.substr(0,11) === "/api/cf/v2/") {
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

})();
