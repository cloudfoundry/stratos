(function () {
  'use strict';

  angular
    .module('cloud-foundry.api')
    .constant('cloud-foundry.api.collectionBase', CollectionBase);

  
  function CollectionBase(foo) {
    this.foo = foo;
  }

  angular.extend(CollectionBase.prototype, {
    //...
  });

})();
