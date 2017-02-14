(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('consoleView', consoleView);

  consoleView.$inject = [
    'app.basePath'
  ];

  /**
   * @namespace app.view.consoleView
   * @memberof app.view
   * @name consoleView
   * @description A console view directive
   * @param {string} path - the application base path
   * @returns {object} The console view directive definition object
   */
  function consoleView(path) {
    return {
      templateUrl: path + 'view/console-view/console-view.html',
      controller: ConsoleViewController,
      controllerAs: 'consoleViewCtrl'
    };

  }

  ConsoleViewController.$inject = ['$rootScope'];

  function ConsoleViewController($rootScope) {
    var vm = this;

    vm.noScroll = function () {
      return $rootScope.consoleViewNoScroll;
    }
  }

})();
