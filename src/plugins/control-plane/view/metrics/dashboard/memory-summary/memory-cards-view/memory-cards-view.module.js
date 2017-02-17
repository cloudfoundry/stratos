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
      templateUrl: 'plugins/control-plane/view/metrics/dashboard/memory-summary/memory-cards-view/memory-cards-view.html'

    });
  }

  CardsViewController.$inject = [
    '$q',
    '$state',
    '$stateParams',
    'app.model.modelManager',
    'app.utils.utilsService'
  ];

  function CardsViewController($q, $state, $stateParams, modelManager, utilsService) {

    var that = this;
    this.metricsModel = modelManager.retrieve('cloud-foundry.model.metrics');
    var controlPlaneModel = modelManager.retrieve('control-plane.model');
    this.guid = $stateParams.guid;
    this.nodes = [];

    function init() {
      return controlPlaneModel.getComputeNodes(that.guid)
        .then(function (nodes) {

          that.nodes = _.filter(nodes, function (node) {
            return node.spec.profile !== 'gluster';
          });

          _.each(that.nodes, function (node) {
            if (node.spec.hostname === '192.168.200.2') {
              node.spec.hostname = 'kubernetes-master';
            }
            if (node.spec.hostname === '192.168.200.3') {
              node.spec.hostname = 'kubernetes-node';
            }
          });
        });
    }

    utilsService.chainStateResolve('cp.metrics.dashboard.summary.cards', $state, init);

  }

  angular.extend(CardsViewController.prototype, {});

})();
