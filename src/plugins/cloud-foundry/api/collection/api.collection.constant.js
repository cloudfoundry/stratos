(function () {
  'use strict';

  angular
    .module('cloud-foundry.api')
    .constant('cloud-foundry.api.collectionBase', CollectionBase);


  function CollectionBase() {}

  angular.extend(CollectionBase.prototype, {
    hello: function (name) {
      console.log("Hello '" + name + "'!");
    }
  });

})();
