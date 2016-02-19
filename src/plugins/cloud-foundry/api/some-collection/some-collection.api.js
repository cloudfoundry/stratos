(function () {
  'use strict';

  angular
    .module('cloud-foundry.api')
    .run(registerSomeCollectionApi);

  registerSomeCollectionApi.$inject = [
    '$http',
    'app.api.apiManager',
    'cloud-foundry.api.collectionBase'
  ];

  function registerSomeCollectionApi($http, apiManager, CollectionBase) {

    function SomeCollectionApi($http) {
      this.$http = $http;
    }

    SomeCollectionApi.prototype = new CollectionBase();

    angular.extend(SomeCollectionApi.prototype, {
    });

    apiManager.register('cloud-foundry.api.some-collect', new SomeCollectionApi($http));
  }

})();
