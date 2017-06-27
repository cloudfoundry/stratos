(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('secondaryNav', navigation);

  /**
   * @memberof app.view
   * @name secondary-nav
   * @description A navigation UI component directive
   * @returns {object} The secondary navigation directive definition object
   */
  function navigation() {
    return {
      controller: SecondaryNavigationController,
      controllerAs: 'navCtrl',
      templateUrl: 'app/view/navbar/navigation/secondary-nav.html'
    };
  }

  /**
   * @memberof app.view
   * @name SecondaryNavigationController
   * @constructor
   * @param {app.model.modelManager} modelManager - the application model manager
   * @property {app.model.navigationModel} navigationModel - the navigation model
   */
  function SecondaryNavigationController(modelManager) {
    var vm = this;
    vm.navigationModel = modelManager.retrieve('app.model.navigation');
  }
})();
