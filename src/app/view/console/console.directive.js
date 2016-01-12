(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('console', console);

  console.$inject = [
    'app.basePath'
  ];

  function console(path) {
    return {
      templateUrl: path + 'view/console/console.html'
    };
  }

})();
