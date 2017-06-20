(function () {
  'use strict';

  angular
    .module('app.framework.widgets')
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
      templateUrl: 'framework/widgets/tabbed-nav/tabbed-nav.html'
    };
  }

  function TabbedNavController() {
  }

})();
