(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('navbar', navbar);

  navbar.$inject = [
    'app.basePath'
  ];

  function navbar(path) {
    return {
      templateUrl: path + '/view/navbar/navbar.html'
    };
  }

})();
