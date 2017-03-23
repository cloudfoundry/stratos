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

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
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

  ApplicationsController.$inject = [
    '$scope',
    '$q',
    '$state',
    'app.utils.utilsService',
    'modelManager',
    'app.event.eventService',
    'app.logged-in.loggedInService'
  ];

  /**
   * @name ApplicationsController
   * @description   Controller for applications module
   * @param {object} $scope - the angular $scope service
   * @param {object} $q - the angular $q service
   * @param {object} $state - the UI router $state service
   * @param {object} utils - the utils service
   * @param {app.model.modelManager} modelManager - the model management service
   * @param {app.event.eventService} eventService - the event bus service
   * @param {object} loggedInService - Logged In Service
   * @constructor
   */
  function ApplicationsController($scope, $q, $state, utils, modelManager, eventService, loggedInService) {

    var authService = modelManager.retrieve('cloud-foundry.model.auth');
    var initialized = $q.defer();

    if (loggedInService.isLoggedIn()) {
      initialized.resolve();
    }

    function init() {
      return initialized.promise
      .then(function () {
        return authService.initialize();
      });
    }

    utils.chainStateResolve('cf.applications', $state, init);

    function onLoggedIn() {
      initialized.resolve();
    }

    var logInListener = eventService.$on(eventService.events.LOGIN, function () {
      onLoggedIn();
    });

    $scope.$on('$destroy', logInListener);
  }

})();
