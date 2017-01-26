(function () {
  'use strict';

  angular
    .module('app.view.metrics.dashboard.namespace.details', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('metrics.dashboard.namespace.details', {
      url: '',
      templateUrl: 'app/view/metrics/namespace-details/namespace-details.html',
      controller: NamespaceDetailsController,
      controllerAs: 'namespaceDetailCtrl'
    });
  }

  NamespaceDetailsController.$inject = [
    '$q',
    '$scope',
    '$state',
    '$stateParams',
    'app.model.modelManager',
    'app.utils.utilsService'
  ];

  /**
   * @namespace app.view.endpoints.dashboard
   * @memberof app.view.endpoints.dashboard
   * @name MetricsDashBoardController
   * @param {object} $q - the Angular $q service
   * @param {object} $scope - the angular scope service
   * @param {object} $state - the UI router $state service
   * @param {app.model.modelManager} modelManager - the application model manager
   * @param {app.utils.utilsService} utilsService - the utils service
   * @param {app.view.registerService} registerService register service to display the core slide out
   * @param {app.view.endpoints.dashboard.dashboardService} dashboardService - service to support endpoints dashboard
   * @param {app.view.endpoints.dashboard.cnsiService} cnsiService - service to support dashboard with cnsi type endpoints
   * @param {app.view.endpoints.dashboard.vcsService} vcsService - service to support dashboard with vcs type endpoints
   * @constructor
   */
  function NamespaceDetailsController($q, $scope, $state, $stateParams, modelManager, utilsService) {

    var that = this;

    this.namespaceName = $stateParams.namespaceName;

    this.namespaceDetails = {};
    var metricsModel = modelManager.retrieve('cloud-foundry.model.metrics');

    function init() {
      that.namespaceDetails = metricsModel.namespaceInformation[that.namespaceName];
      return $q.resolve();
    }

    utilsService.chainStateResolve('metrics.dashboard.namespace.details', $state, init);

  }

})
();
