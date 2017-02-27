(function () {
  'use strict';

  angular
    .module('control-plane.view.metrics.dashboard.summary.card', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cp.metrics.dashboard.summary.cards', {
      url: '/tiles',
      params: {
        guid: ''
      },
      controller: CardsViewController,
      controllerAs: 'cardsViewCtrl',
      scope: {},
      templateUrl: 'plugins/control-plane/view/metrics/dashboard/summary/node-cards-view/node-cards-view.html'

    });
  }

  CardsViewController.$inject = [
    '$q',
    '$state',
    '$stateParams',
    'app.utils.utilsService',
    'app.model.modelManager',
    'control-plane.metrics.metrics-data-service'
  ];

  function CardsViewController($q, $state, $stateParams, utilsService, modelManager, metricsDataService) {

    var that = this;
    this.guid = $stateParams.guid;
    this.nodes = [];
    var metricsModel = modelManager.retrieve('cloud-foundry.model.metrics');


    function init() {
      that.nodes = metricsDataService.getNodes(that.guid, true);

      var promises = [];
      _.each(that.nodes, function (node) {
        var hostname = node.spec.hostname;

        // Add cpu utilization data
        promises.push(metricsDataService.addNodeMetric(that.guid,
          hostname,
          'cpu_node_utilization_gauge',
          metricsModel.makeNodeNameFilter(hostname)
        ));

      });
      return $q.all(promises).catch(_.noop);
    }

    utilsService.chainStateResolve('cp.metrics.dashboard.summary.cards', $state, init);

  }

  angular.extend(CardsViewController.prototype, {});

})();
