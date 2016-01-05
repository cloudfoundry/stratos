(function () {
  'use strict';

  angular
    .module('app')
    .directive('app', app);

  app.$inject = ['app.basePath'];

  function app(basePath) {
    return {
      templateUrl: basePath + 'app.html'
    };
  }

})();
