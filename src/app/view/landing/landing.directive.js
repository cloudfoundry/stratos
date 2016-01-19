(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('landing', landing);

  landing.$inject = [
    'app.basePath'
  ];

  function landing(path) {
    return {
      templateUrl: path + 'view/landing/landing.html'
    };
  }

})();
