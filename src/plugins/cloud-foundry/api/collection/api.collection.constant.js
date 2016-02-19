(function () {
  'use strict';

  angular
    .module('cloud-foundry.api')
    .constant('cloud-foundry.api.collectionBase', CollectionBase);

  var CollectionBase = function() {
      this.foo = "bar";
  };

  angular.extend(CollectionBase.prototype, {
    hello: function(name) {
      console.log("Hello '" + name + "'!");
    }
  });

})();
