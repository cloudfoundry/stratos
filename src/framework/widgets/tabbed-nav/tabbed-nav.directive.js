(function () {
  'use strict';

  angular
    .module('helion.framework.widgets')
    .directive('tabbedNav', tabbedNav);

  tabbedNav.$inject = ['helion.framework.basePath'];

  function tabbedNav(path) {
    return {
      bindToController: {
        routes: '=',
        viewName: '@'
      },
      controller: TabbedNavController,
      controllerAs: 'tabbedNavCtrl',
      restrict: 'E',
      scope: {},
      templateUrl: path + 'widgets/tabbed-nav/tabbed-nav.html'
    };
  }

  TabbedNavController.$inject = [];

  function TabbedNavController() {
  }

})();
