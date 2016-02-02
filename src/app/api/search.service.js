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
   * @description Search service provider
   * @param {object} $http - the $http service
   * @returns {object} The search service
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
     * @function index
     * @memberof app.api.searchService
     * @name index
     * @description Index a resource with given type
     * @param {string} type - the resource type
     * @param {object} options - the specification object
     * @returns {object} The resolved/rejected promise
     * @public
     * @example
     * searchService.index('application', { name: 'foo' }).then(...);
     */
    function index(type, options) {
      return $http.post(path(INDEX, type), options);
    }

    /**
     * @function remove
     * @memberof app.api.searchService
     * @name remove
     * @description Remove a resource from the index
     * @param {string} type - the resource type
     * @param {string} id - the resource ID
     * @returns {object} The resolved/rejected promise
     * @public
     */
    function remove(type, id) {
      return $http.delete(path(INDEX, type, id));
    }

    /**
     * @function retrieve
     * @memberof app.api.searchService
     * @name retrieve
     * @description Retrieve a resource from the index
     * @param {string} type - the resource type
     * @param {string} id - the resource ID
     * @returns {object} The resolved/rejected promise
     */
    function retrieve(type, id) {
      return $http.get(path(INDEX, type, id, '_source'));
    }

    /**
     * @function update
     * @memberof app.api.searchService
     * @name update
     * @description Update a resource in the index
     * @param {string} type - the resource type
     * @param {string} id - the resource ID
     * @param {object} data - the given partial update data object
     * @returns {object} The resolved/rejected promise
     * @public
     */
    function update(type, id, data) {
      return $http.put(path(INDEX, type, id), data);
    }

    /**
     * @function search
     * @memberof app.api.searchService
     * @name search
     * @description Search for all resources described by the query,
     * with pagination information
     * @param {string} type - the resource type
     * @param {object} query - the Elasticsearch query object
     * @param {object} params - specify pagination if provided
     * @returns {object} The resolved/rejected promise
     * @public
     * @example
     * searchService.search('application',
     *   {
     *     bool: {
     *       must: [ { match: { name: 'App' } } ]
     *     }
     *   },
     *   {
     *     size: 5,
     *     from: 5
     *   }
     * ).then(function (response) {
     *   console.log(response.data.hits.total, response.data.hits.hits);
     * });
     */
    function search(type, query, params) {
      return $http.post(path(INDEX, type, '_search'),
        { query: query },
        { params: params }
      );
    }

    /**
     * @function path
     * @name path
     * @description Join all arguments to form a path
     * @returns {string} The final path string
     * @private
     */
    function path() {
      var args = [].slice.call(arguments);
      return args.join('/').replace(/\/+/g, '/');
    }
  }

})();
