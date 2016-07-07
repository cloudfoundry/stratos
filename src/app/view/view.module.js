(function () {
  'use strict';

  /**
   * @namespace app.view
   * @memberof app
   * @name view
   * @description The view layer of the UI platform that contains
   * the Angular directives and controllers
   */
  angular
    .module('app.view', [
      'app.view.config-clusters',
      'app.view.settings-page',
      'app.view.endpoints',
      'app.view.error-page'
    ]);

})();
