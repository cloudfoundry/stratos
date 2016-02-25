(function () {
  'use strict';

  angular
    .module('cloud-foundry.api', [])
    .run(registerCFApi);

  registerCFApi.$inject = [
    '$http',
    'app.api.apiManager',
    'cloud-foundry.api.collectionService',
    'cloud-foundry.api.appsService'
  ];

  function registerCFApi($http, apiManager, CollectionService, AppsAPI) {

    /*
     Generic CF resources that follow the standard pattern with no unique functionality.
     For other resources that do have unique functionality or don't support the standard set of verbs then derive an
     object off of collection and add or remove specific functions.
     */
    var genericCollections = [
      'domains',
      'private_domains',
      'shared_domains',
      'quota_definitions',
      'service_bindings',
      'service_plans',
      'services',
      'service_instances',
      'user_provided_service_instances',
      'buildpacks'
    ];

    function CFApi($http) {
      this.$http = $http;
      CFApiInitializeCollections(this);
      apiManager.register('cloud-foundry.api.apps', new AppsAPI(this, $http, CollectionService));
    }

    angular.extend(CFApi.prototype, {

      getApiInfo: function (options) {
        this.get('/v2/info', options);
      },

      get: function (path, options) {
        this.$http.get(path, options);
      },

      delete_: function (path, options) {
        this.$http.delete(path, options);
      },

      put: function (path, options) {
        this.$http.put(path, options);
      },

      post: function (path, options) {
        this.$http.post(path, options);
      }

    });

    apiManager.register('cloud-foundry.api', new CFApi($http));

    function CFApiInitializeCollections(api) {
      /*eslint-disable no-loop-func */
      for (var i = genericCollections.length - 1; i >= 0; i--) {
        (function(j) {

          var collectionName = genericCollections[j];

          var collectionAPI = function ($http, CollectionService) {
            CollectionService.call(this, collectionName);
            this.$http = $http;
            this.api = api;
          };

          apiManager.register('cloud-foundry.api.' + collectionName, new collectionAPI($http, CollectionService));
        })(i);
      }
      /*eslint-enable no-loop-func */
    }
  }

})();
