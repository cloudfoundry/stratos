(function () {
  'use strict';

  angular
    .module('helion.framework.widgets')
    .directive('tabbedNav', tabbedNav);

  function tabbedNav() {
    return {
      bindToController: {
        routes: '=',
        viewName: '@'
      },
      controller: TabbedNavController,
      controllerAs: 'tabbedNavCtrl',
      restrict: 'E',
      scope: {},
      templateUrl: 'widgets/tabbed-nav/tabbed-nav.html'
    };
  }

  TabbedNavController.$inject = [];

  function TabbedNavController() {
  }

})();
