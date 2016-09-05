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
    '$q',
    '$state',
    'app.utils.utilsService',
    'app.model.modelManager',
    'app.event.eventService'
  ];

  function ApplicationsController($q, $state, utils, modelManager, eventService) {

    var authModel = modelManager.retrieve('cloud-foundry.model.auth');

    var initialized = $q.defer();

    function init() {

      return initialized.promise.then(function () {
        return authModel.initialize();
      });
    }

    utils.chainStateResolve('cf.applications', $state, init);

    function onLoggedIn() {
      initialized.resolve();
    }

    eventService.$on(eventService.events.LOGIN, function () {
      onLoggedIn();
    });

  }

})();
