(function () {
  'use strict';

  angular
    .module('control-plane.view.metrics.dashboard.memory-summary.cards', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cp.metrics.dashboard.memory-summary.cards', {
      url: '/tiles',
      params: {
        guid: ''
      },
      controller: CardsViewController,
      controllerAs: 'cardsViewCtrl',
      scope: {},
      templateUrl: 'plugins/control-plane/view/metrics/dashboard/memory-summary/memory-cards-view/memory-cards-view.html',
      ncyBreadcrumb: {
        skip: true
      }
    });
  }

  CardsViewController.$inject = [
    '$q',
    '$state',
    '$stateParams',
    'app.model.modelManager',
    'app.utils.utilsService',
    'control-plane.metrics.metrics-data-service'

  ];

  function CardsViewController($q, $state, $stateParams, modelManager, utilsService, metricsDataService) {

    var that = this;
    this.metricsModel = modelManager.retrieve('cloud-foundry.model.metrics');
    var controlPlaneModel = modelManager.retrieve('control-plane.model');
    this.guid = $stateParams.guid;
    this.nodes = [];

    function init() {
      that.nodes = metricsDataService.getNodes(that.guid, true);
      return $q.resolve();
    }

    utilsService.chainStateResolve('cp.metrics.dashboard.memory-summary.cards', $state, init);

  }

  angular.extend(CardsViewController.prototype, {});

})();
