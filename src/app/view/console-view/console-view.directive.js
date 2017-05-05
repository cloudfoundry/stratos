(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('consoleView', consoleView);

  /**
   * @namespace app.view.consoleView
   * @memberof app.view
   * @name consoleView
   * @description A console view directive
   * @returns {object} The console view directive definition object
   */
  function consoleView() {
    return {
      templateUrl: 'app/view/console-view/console-view.html',
      controller: ConsoleViewController,
      controllerAs: 'consoleViewCtrl'
    };

  }

  function ConsoleViewController($rootScope) {
    var vm = this;

    vm.noScroll = function () {
      return $rootScope.consoleViewNoScroll;
    };
  }

})();
