(function () {
  'use strict';

  angular
    .module('control-plane.view.metrics.dashboard.data-traffic-summary.cards', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cp.metrics.dashboard.data-traffic-summary.cards', {
      url: '/tiles',
      params: {
        guid: ''
      },
      controller: CardsViewController,
      controllerAs: 'cardsViewCtrl',
      scope: {},
      templateUrl: 'plugins/control-plane/view/metrics/dashboard/data-traffic-summary/data-traffic-cards-view/data-traffic-cards-view.html'

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

    utilsService.chainStateResolve('cp.metrics.dashboard.data-traffic-summary.cards', $state, init);

  }

  angular.extend(CardsViewController.prototype, {});

})();
