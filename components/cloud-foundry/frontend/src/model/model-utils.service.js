(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model
   * @memberof cloud-foundry.model
   */
  angular
    .module('cloud-foundry.model')
    .factory('modelUtils', modelUtilsServiceFactory);

  modelUtilsServiceFactory.$inject = [
    '$q',
    '$http'
  ];

  /**
   * @function modelUtilsServiceFactory
   * @memberof cloud-foundry.model
   * @param {object} $q - The Angular $q service
   * @param {object} $http - The Angular $http service
   * @description Service to provide utils for CF models
   * @returns {object} The Model Utils Service
   */
  function modelUtilsServiceFactory($q, $http) {

    return {
      makeListParams: makeListParams,
      makeHttpConfig: makeHttpConfig,
      dePaginate: dePaginate
    };

    /**
     * @function makeHttpConfig
     * @memberof cloud-foundry.model.modelUtils
     * @description Creates the http config for a portal proxy request to an individual CNSI. This uses CNSI passthrough
     * @param {object} cnsiGuid - the CNSI target to make request to.
     * @returns {object} the $http service http config
     */
    function makeHttpConfig(cnsiGuid) {
      var headers = {'x-cnap-cnsi-list': cnsiGuid};
      // Add passthrough header
      angular.extend(headers, {
        'x-cnap-passthrough': 'true'
      });
      return {
        headers: headers
      };
    }

    /**
     * @function makeListParams
     * @memberof cloud-foundry.model.modelUtils
     * @description Apply a set of default parameters to be used in HCF list calls
     * @param {object} params - existing custom parameters, these will override defaults
     * @returns {object} the $http service http parameters
     */
    function makeListParams(params) {
      return _.defaults(params, {
        'results-per-page': 100
      });
    }

    /**
     * @function dePaginate
     * @memberof cloud-foundry.model.modelUtils
     * @description Given a HCF response from a 'list' style call return a collection containing all resources
     * @param {Array} pageOneResponseData - Response from a HCF 'list' request. This must be page 1 and will contain pagination
     * data
     * @param {object} httpConfigOptions - Any special http configuration options
     * @returns {promise} promise when complete containing all list entries regardless of page
     * @public
     */
    function dePaginate(pageOneResponseData, httpConfigOptions) {
      var list = pageOneResponseData.resources;
      // Be sure to use the next_url as a basis for other calls, this can include the original params and any pagination
      // specific ones added by HCF (such as order-direction)
      var url = pageOneResponseData.next_url;
      if (!url) {
        return $q.resolve(list);
      }

      // Make all calls in parallel
      var tasks = [];
      for (var i = 2; i <= pageOneResponseData.total_pages; i++) {
        tasks.push($http.get('/pp/v1/proxy' + url.replace('page=2', 'page=' + i), httpConfigOptions));
      }
      return $q.all(tasks).then(function (results) {
        // Maintain order
        for (var i = 0; i < results.length; i++) {
          Array.prototype.push.apply(list, results[i].data.resources);
        }
        return list;
      });
    }

  }
})();
