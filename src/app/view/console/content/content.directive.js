(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('content', content);

  content.$inject = [
    'app.basePath'
  ];

  function content(path) {
    return {
      templateUrl: path + '/view/console/content/content.html'
    };
  }

})();
