(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('bottomNav', navigation);

  /**
   * @namespace app.view.navigation
   * @memberof app.view
   * @name navigation
   * @description A navigation UI component directive
   * @returns {object} The navigation directive definition object
   */
  function navigation() {
    return {
      controller: NavigationController,
      controllerAs: 'btmNavCtrl',
      templateUrl: 'app/view/navbar/navigation/bottom-nav.html'
    };
  }

  /**
   * @namespace app.view.NavigationController
   * @memberof app.view
   * @name NavigationController
   * @constructor
   * @param {app.model.modelManager} modelManager - the application model manager
   * @property {app.model.navigationModel} navigationModel - the navigation model
   */
  function NavigationController(modelManager) {
    this.navigationModel = modelManager.retrieve('app.model.navigation');

  }
})();
