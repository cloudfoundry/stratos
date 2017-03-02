(function () {
  'use strict';

  angular
    .module('control-plane.view.metrics.dashboard.summary')
    .directive('nodesStatusCard', nodesStatusCard);

  function nodesStatusCard() {
    return {
      bindToController: {
        guid: '@'
      },
      controller: NodesStatusCardController,
      controllerAs: 'nodesStatusCardCtrl',
      scope: {},
      templateUrl: 'plugins/control-plane/view/metrics/dashboard/summary/nodes-status-card/nodes-status-card.html',
      ncyBreadcrumb: {
        skip: true
      }
    };
  }

  NodesStatusCardController.$inject = [
    '$q',
    '$state',
    'app.model.modelManager',
    'app.utils.utilsService',
    'control-plane.metrics.metrics-data-service'
  ];

  function NodesStatusCardController($q, $state, modelManager, utilsService, metricsDataService) {

    var that = this;
    this.metricsModel = modelManager.retrieve('control-plane.model.metrics');

    this.nodes = [];
    this.cardData = {
      title: gettext('Summary')
    };

    function init() {
      that.nodes = metricsDataService.getNodes(that.guid);

      return $q.resolve();
    }

    utilsService.chainStateResolve('cp.metrics.dashboard.summary', $state, init);

  }

  angular.extend(NodesStatusCardController.prototype, {
    getCardData: function () {
      return this.cardData;
    }
  });

})();
