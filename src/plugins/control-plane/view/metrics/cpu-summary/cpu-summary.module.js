(function () {
  'use strict';

  angular
    .module('control-plane.view.metrics.dashboard.cpu-summary', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cp.metrics.dashboard.cpu-summary', {
      url: '/cpu',
      params: {
        newlyCreated: false
      },
      templateUrl: 'plugins/control-plane/view/metrics/cpu-summary/cpu-summary.html',
      controller: CpuSummaryController,
      controllerAs: 'cpuSummaryCtrl'
    });
  }

  CpuSummaryController.$inject = [
    '$state',
    '$stateParams',
    '$log',
    '$q',
    '$scope',
    '$filter',
    'app.model.modelManager',
    'cloud-foundry.view.applications.application.summary.addRoutes',
    'cloud-foundry.view.applications.application.summary.editApp',
    'app.utils.utilsService',
    'app.view.endpoints.clusters.routesService',
    'helion.framework.widgets.dialog.confirm',
    'app.view.notificationsService'
  ];

  function CpuSummaryController($state, $stateParams, $log, $q, $scope, $filter,
                                        modelManager, addRoutesService, editAppService, utils,
                                        routesService, confirmDialog, notificationsService) {

    this.model = modelManager.retrieve('cloud-foundry.model.application');
    this.userCnsiModel = modelManager.retrieve('app.model.serviceInstance.user');
    this.authModel = modelManager.retrieve('cloud-foundry.model.auth');
    this.routesService = routesService;
    this.id = $stateParams.guid;
    this.cnsiGuid = $stateParams.cnsiGuid;
    this.addRoutesService = addRoutesService;
    this.editAppService = editAppService;
    this.confirmDialog = confirmDialog;
    this.notificationsService = notificationsService;
    this.utils = utils;
    this.$log = $log;
    this.$q = $q;
    this.instanceViewLimit = 5;

  }

  angular.extend(CpuSummaryController.prototype, {});

})();
