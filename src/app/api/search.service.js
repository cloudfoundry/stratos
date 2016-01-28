(function () {
  'use strict';

  var INDEX = 'data';

  /**
   * @namespace app.api
   * @memberof app.api
   * @name app.api.searchService
   * @description search service provider
   */
  angular
    .module('app.api')
    .factory('app.api.searchService', serviceFactory);

  serviceFactory.$inject = [
    '$http'
  ];

  /**
   * Factory function to create searchService
   * @parma $http {function}
   * @return {Object} searchService
   */
  function serviceFactory($http) {
    return {
      index: index,
      search: search
    };

    /**
     * Index a resource with given type
     * @param type {string} the resource type
     * @param options {object} the specification object
     * @returns {HttpPromise}
     * @public
     * @example
     ```
      searchService.index('application', { name: 'foo' }).then(...);
     ```
     */
    function index(type, options) {
      return $http.post([INDEX, type].join('/'), options);
    }

    /**
     * Search for all resources described by the query, with pagination
     * information
     * @param type {string} the resource type
     * @param query {object} the Elasticsearch query object
     * @param params {object} specify pagination if provided.
     * @returns {HttpPromise}
     * @public
     * @example
     ```
      searchService.search('application',
        {
          bool: {
            must: [ { match: { name: 'App' } } ]
          }
        },
        {
          size: 5,
          from: 5
        }
      ).then(function (response) {
        console.log(response.data.hits.total, response.data.hits.hits);
      });
     ```
     */
    function search(type, query, params) {
      return $http.post([INDEX, type, '/_search'].join('/'),
        { query: query },
        { params: params }
      );
    }
  }

})();
