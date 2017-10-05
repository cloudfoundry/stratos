(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications', [
      'cloud-foundry.view.applications.application',
      'cloud-foundry.view.applications.list',
      'cloud-foundry.view.applications.services',
      'cloud-foundry.view.applications.workflows'
    ])
    .config(registerRoute);

  function registerRoute($stateProvider) {
    $stateProvider.state('cf', {
      url: '/cf',
      template: '<div ui-view></div>'
    });
    $stateProvider.state('cf.applications', {
      url: '/applications',
      templateUrl: 'plugins/cloud-foundry/view/applications/applications.html',
      controller: ApplicationsController,
      controllerAs: 'appsCtrl',
      data: {
        activeMenuState: 'cf.applications'
      }
    });
  }

  /**
   * @name ApplicationsController
   * @description   Controller for applications module
   * @param {object} $scope - the angular $scope service
   * @param {object} $q - the angular $q service
   * @param {object} $state - the UI router $state service
   * @param {object} $parse - the angular $parse service
   * @param {object} appUtilsService - the appUtilsService service
   * @param {app.model.modelManager} modelManager - the model management service
   * @param {app.utils.appEventService} appEventService - the event bus service
   * @param {object} appLoggedInService - Logged In Service
   * @constructor
   */
  function ApplicationsController($scope, $q, $state, $parse, appUtilsService, modelManager, appEventService, appLoggedInService) {

    var authService = modelManager.retrieve('cloud-foundry.model.auth');
    var initialized = $q.defer();
    var vm = this;
    var appController = $parse('applicationCtrl');
    if (appController) {
      vm.appController = appController($scope);
      vm.appController.showGlobalSpinner = true;
      vm.appController.globalSpinnerLabel = 'Collecting Cloud Foundry Metadata';
    } else {
      vm.appController = {};
    }

    if (appLoggedInService.isLoggedIn()) {
      initialized.resolve();
    }

    function init() {
      return initialized.promise
        .then(function () {
          return authService.initialize().finally(function () {
            vm.appController.showGlobalSpinner = false;
          });
        });
    }

    appUtilsService.chainStateResolve('cf.applications', $state, init);

    function onLoggedIn() {
      initialized.resolve();
    }

    var logInListener = appEventService.$on(appEventService.events.LOGIN, function () {
      onLoggedIn();
    });

    $scope.$on('$destroy', logInListener);
  }

})();
