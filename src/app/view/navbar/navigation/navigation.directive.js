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
   * @property {app.view.navigationController} controller - the controller
   * @property {string} controllerAs - the identifier for the controller
   * @property {string} templateUrl - the template filepath
   */
  function navigation(path) {
    return {
      controller: navigationController,
      controllerAs: 'navigationCtrl',
      templateUrl: path + '/view/navbar/navigation/navigation.html'
    };
  }

  navigationController.$inject = [
    'app.model.modelManager'
  ];

  /**
   * @namespace app.view.navigationController
   * @memberof app.view
   * @name navigationController
   * @param {app.model.modelManager} modelManager - the application model manager
   * @property {app.model.navigation} menu - the navigation model
   */
  function navigationController(modelManager) {
    this.menu = modelManager.retrieve('app.model.navigation');
  }

})();
