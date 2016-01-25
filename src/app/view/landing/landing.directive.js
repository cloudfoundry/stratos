(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('landing', landing);

  landing.$inject = [
    'app.basePath'
  ];

  /**
   * @namespace app.view.landing
   * @memberof app.view
   * @name landing
   * @description A landing page directive
   * @property {string} templateUrl - the landing page template filepath
   */
  function landing(path) {
    return {
      templateUrl: path + 'view/landing/landing.html'
    };
  }

})();
