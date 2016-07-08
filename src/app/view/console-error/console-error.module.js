(function () {
  'use strict';

  angular
    .module('app.view.error-page', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('error-page', {
      url: '/error',
      templateUrl: '/app/view/console-error/console-error.html',
      controller: ErrorPageController,
      controllerAs: 'errPageCtrl',
      params: {
        hideNavigation: true,
        error: 'unknown'
      }
    });
  }

  ErrorPageController.$inject = [
    '$stateParams'
  ];

  /**
   * @name ErrorPageController
   * @constructor
   * @description Controller for the Error Page
   * @param  {$stateParams} $stateParams - UI Router state params
   * @property {string} error - type of error to display
   */
  function ErrorPageController($stateParams) {
    this.error = $stateParams.error;
  }

  angular.extend(ErrorPageController.prototype, {
  });

})();
