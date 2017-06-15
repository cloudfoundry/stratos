(function () {
  'use strict';

  angular
    .module('app.view')
    .constant('showLanguageSelection', false)
    .directive('navbar', navbar);

  /**
   * @namespace app.view.navbar
   * @memberof app.view
   * @name navbar
   * @description A navbar directive
   * @returns {object} The navbar directive definition object
   */
  function navbar() {
    return {
      templateUrl: 'app/view/navbar/navbar.html',
      controller: NavBarController,
      controllerAs: 'navBarCtrl',
      bindToController: true
    };
  }

  function NavBarController(showLanguageSelection, modelManager) {
    var vm = this;
    vm.showLanguageSelection = showLanguageSelection || false;
    vm.accountModel = modelManager.retrieve('app.model.account');
  }

})();
