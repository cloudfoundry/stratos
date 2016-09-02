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
    'app.model.modelManager'
  ];

  function ApplicationsController($scope, $q, $state, utils, modelManager) {

    console.log('Running Applications Controller');
    var authService = modelManager.retrieve('cloud-foundry.model.auth');
    var stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');

    var init = function () {

      return stackatoInfo.getStackatoInfo().then(function (stackatoInfo) {

        // Initialise Auth Service
        var authServiceInitPromises = [];
        if (Object.keys(stackatoInfo.endpoints.hcf).length > 0) {
          _.each(stackatoInfo.endpoints.hcf, function (hcfEndpoint, guid) {
            authServiceInitPromises.push(authService.initAuthService(guid, true));
          });
          return $q.all(authServiceInitPromises);
        } else {
          return $q.resolve();
        }
      });
    };
    utils.chainStateResolve('cf.applications', $state, init);
  }

})();
