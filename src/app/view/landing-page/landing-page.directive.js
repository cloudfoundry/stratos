(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('landingPage', landingPage);

  landingPage.$inject = [
    'app.basePath'
  ];

  function landingPage(path) {
    return {
      templateUrl: path + 'view/landing-page/landing-page.html'
    };
  }

})();
