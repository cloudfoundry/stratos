(function () {
  'use strict';

  angular
    .module('cloud-foundry.api')
    .factory('cloud-foundry.api.collectionService', CollectionServiceFactory);

  CollectionServiceFactory.$inject = [
    'app.api.apiManager'
  ];

  function CollectionServiceFactory(apiManager) {

<<<<<<< HEAD
    var apiVersionPrefix = '/api/v2/';
=======
    var apiVersionPrefix = '/api/cf/v2/';
>>>>>>> d232134aeec0282564afeb8c3a9b460f71731f62

    function makeQueryString(options) {
      options = options || {};

      var query = '';
      var firstQuery = true;

      if (options.queries) {
        _.each(options.queries, function (value, key) {
          query = query + ((firstQuery ? '' : '&') + key + '=' + value);
          firstQuery = false;
        });
      }

      if (options.filter && options.filter.name) {
        query = query + ((firstQuery ? '' : '&') + 'q=' + options.filter.name + ':' + options.filter.value);
      }

      return query;
    }

    // CollectionService constructor
    function CollectionService(name) {
      this.name = name;
      this.api = apiManager.retrieve('cloud-foundry.api');

      this.getCollectionUrl = function () {
        return apiVersionPrefix + this.name;
      };

      this.get = function (resourceIdentifier, params) {
        var options = {};
        options.paramSerializer = makeQueryString;
        options.params = params;

        var path = this.getCollectionUrl() + '/' + resourceIdentifier;

        this.api.get(path, options);
      };

      this.getSummary = function (resourceIdentifier, params) {
        var options = {};
        options.paramSerializer = makeQueryString;
        options.params = params;

        var path = this.getCollectionUrl() + '/' + resourceIdentifier + '/summary';

        this.api.get(path, options);
      };

      this.delete_ = function (resourceIdentifier, params) {
        var options = {};
        options.paramSerializer = makeQueryString;
        options.params = params;

        var path = this.getCollectionUrl() + '/' + resourceIdentifier;

        this.api.delete_(path, options);
      };

      this.create = function (data, params) {
        var options = {};
        options.paramSerializer = makeQueryString;
        options.params = params;
        options.data = data;

        var path = this.getCollectionUrl();

        this.api.post(path, options);
      };

      this.update = function (resourceIdentifier, data, params) {
        var options = {};
        options.paramSerializer = makeQueryString;
        options.params = params;
        options.data = data;

        var path = this.getCollectionUrl() + '/' + resourceIdentifier;

        this.api.put(path, options);
      };

      this.list = function (params) {
        var options = {};
        options.paramSerializer = makeQueryString;
        options.params = params;

        var path = this.getCollectionUrl();

        this.api.get(path, options); // TODO: need to deal with the Page.js collection response type
      };
    }

    return CollectionService;
  }

})();
