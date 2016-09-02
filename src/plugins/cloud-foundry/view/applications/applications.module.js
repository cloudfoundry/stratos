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

    var authService = modelManager.retrieve('cloud-foundry.model.auth');
    var stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');

    var init = function () {

      var getStackatoInfo = function () {
        // Check if StackatoInfo is uninitialised
        if (Object.keys(stackatoInfo.info).length === 0) {
          return stackatoInfo.getStackatoInfo();
        }
        return $q.resolve(stackatoInfo.info);
      };

      return getStackatoInfo().then(function (stackatoInfo) {

        // Initialise Auth Service
        var authServiceInitPromises = [];
        if (Object.keys(stackatoInfo.endpoints.hcf).length > 0) {
          _.each(stackatoInfo.endpoints.hcf, function (hcfEndpoint, guid) {
            if (hcfEndpoint.user === null){
              // User hasn't connected to this endpoint
              return;
            }
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
