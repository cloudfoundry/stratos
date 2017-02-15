(function () {
  'use strict';

  angular
    .module('control-plane.view.metrics.dashboard.summary')
    .directive('nodesStatusCard', nodesStatusCard);

  function nodesStatusCard() {
    return {
      bindToController: {
        nodes: '=',
        guid: '@'
      },
      controller: NodesStatusCardController,
      controllerAs: 'nodesStatusCardCtrl',
      scope: {},
      templateUrl: 'plugins/control-plane/view/metrics/dashboard/summary/nodes-status-card/nodes-status-card.html'
    };
  }

  NodesStatusCardController.$inject = [
    '$q',
    '$state',
    'app.model.modelManager',
    'app.utils.utilsService'
  ];

  function NodesStatusCardController($q, $state, modelManager, utilsService) {

    this.metricsModel = modelManager.retrieve('cloud-foundry.model.metrics');

    this.cardData = {
      title: gettext('Summary')
    };

    function init() {
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
