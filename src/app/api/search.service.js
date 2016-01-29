(function () {
  'use strict';

  var INDEX = 'data';

  angular
    .module('app.api')
    .factory('app.api.searchService', serviceFactory);

  serviceFactory.$inject = [
    '$http'
  ];

  /**
   * @memberof app.api
   * @name app.api.searchService
   * @description search service provider
   */
  function serviceFactory($http) {
    return {
      delete: remove,
      get: retrieve,
      index: index,
      search: search,
      update: update
    };

    /**
     * @function index, index a resource with given type
     * @memberof app.api.searchService
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
      return $http.post(path(INDEX, type), options);
    }

    /**
     * @function remove, remove a resource from the index
     * @memberof app.api.searchService
     * @param type {string} the resource type
     * @param id {string} the resource id
     * @returns {HttpPromise}
     * @public
     */
    function remove(type, id) {
      return $http.delete(path(INDEX, type, id));
    }

    /**
     * @function retrieve, retrieve a resource from the index
     * @memberof app.api.searchService
     * @param type {string} the resource type
     * @param id {string} the resource id
     * @returns {HttpPromise}
     */
    function retrieve(type, id) {
      return $http.get(path(INDEX, type, id, '_source'));
    }

    /**
     * @function update, update a resource in the index
     * @memberof app.api.searchService
     * @param type {string} the resource type
     * @param id {string} the resource id
     * @param data {Object} the given partial update data object
     * @returns {HttpPromise}
     * @public
     */
    function update(type, id, data) {
      return $http.put(path(INDEX, type, id), data);
    }

    /**
     * @function search, search for all resources described by the query,
     * with pagination information
     * @memberof app.api.searchService
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
      return $http.post(path(INDEX, type, '_search'),
        { query: query },
        { params: params }
      );
    }

    /**
     * Util function, join all arguments to form a path
     * @returns {string}
     * @private
     */
    function path() {
      var args = [].slice.call(arguments);
      return args.join('/').replace(/\/+/g, '/');
    }
  }

})();
