(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('navItem', navItem);

  /**
   * @namespace app.view.navItem
   * @memberof app.view
   * @description A navigation UI component directive
   * @returns {object} The navItem directive definition object
   */
  function navItem() {
    return {
      controller: NavItemController,
      controllerAs: 'navItem',
      templateUrl: 'app/view/navbar/navigation/nav-item.html',
      bindToController: {
        item: '='
      }
    };
  }

  /**
   * @namespace app.view.NavItemController
   * @memberof app.view
   * @name NavItemController
   * @constructor
   */
  function NavItemController() {
  }
})();
