(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('bottomBar', bottomBar);

  bottomBar.$inject = [
    'app.basePath'
  ];

  function bottomBar(path) {
    return {
      templateUrl: path + '/view/console/bottom-bar/bottom-bar.html'
    };
  }

})();
