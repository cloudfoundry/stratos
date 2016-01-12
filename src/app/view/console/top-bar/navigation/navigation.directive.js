(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('navigation', navigation);

  navigation.$inject = [
    'app.basePath'
  ];

  function navigation(path) {
    return {
      templateUrl: path + '/view/console/top-bar/navigation/navigation.html'
    };
  }

})();
