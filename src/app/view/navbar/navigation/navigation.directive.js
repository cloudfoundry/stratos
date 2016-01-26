(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('navigation', navigation);

  navigation.$inject = [
    'app.basePath'
  ];

  /**
   * @namespace app.view.navigation
   * @memberof app.view
   * @name navigation
   * @description A navigation UI component directive
   * @param {string} path - the application base path
   * @property {app.view.NavigationController} controller - the controller
   * @property {string} controllerAs - the identifier for the controller
   * @property {string} templateUrl - the template filepath
   */
  function navigation(path) {
    return {
      controller: NavigationController,
      controllerAs: 'navigationCtrl',
      templateUrl: path + '/view/navbar/navigation/navigation.html'
    };
  }

  NavigationController.$inject = [
    'app.model.modelManager'
  ];

  /**
   * @namespace app.view.NavigationController
   * @memberof app.view
   * @name NavigationController
   * @param {app.model.modelManager} modelManager - the application model manager
   * @property {app.model.navigation} menu - the navigation model
   */
  function NavigationController(modelManager) {
    this.menu = modelManager.retrieve('app.model.navigation');
  }

})();
