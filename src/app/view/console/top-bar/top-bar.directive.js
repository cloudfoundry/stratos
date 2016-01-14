(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('topBar', topBar);

  topBar.$inject = [
    'app.basePath'
  ];

  function topBar(path) {
    return {
      templateUrl: path + '/view/console/top-bar/top-bar.html'
    };
  }

})();
