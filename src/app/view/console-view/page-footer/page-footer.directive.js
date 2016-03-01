(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('pageFooter', pageFooter);

  pageFooter.$inject = [
    'app.basePath'
  ];

  function pageFooter(path) {
    return {
      templateUrl: path + 'view/console-view/page-footer/page-footer.html'
    };
  }

})();
