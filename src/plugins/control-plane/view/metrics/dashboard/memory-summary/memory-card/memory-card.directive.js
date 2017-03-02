
(function () {
  'use strict';

  angular
    .module('control-plane.view.metrics.dashboard')
    .directive('memoryCard', memoryCard);

  function memoryCard() {
    return {
      bindToController: {
        node: '@',
        showUtilizationDonut: '=',
        title: '@',
        metricsNodeName: '@',
        nodeMetrics: '='
      },
      controller: MemoryCardController,
      controllerAs: 'memoryCardCtrl',
      scope: {},
      templateUrl: 'plugins/control-plane/view/metrics/dashboard/memory-summary/memory-card/memory-card.html'
    };
  }

  MemoryCardController.$inject = [
    '$state',
    '$q',
    'app.model.modelManager',
    'app.utils.utilsService'
  ];

  function MemoryCardController($state, $q, modelManager, utilsService) {

    var that = this;
    this.metricsModel = modelManager.retrieve('control-plane.model.metrics');
    this.$state = $state;
    this.utilsService = utilsService;

    this.cardData = {
      title: this.title
    };

  }

  angular.extend(MemoryCardController.prototype, {

    getCardData: function () {
      return this.cardData;
    },

    getNodeFilter: function () {
      return this.metricsModel.makeNodeNameFilter(this.metricsNodeName);
    },

    getNodeName: function () {

      if (this.node === '*') {
        return 'all';
      } else {
        return this.node;
      }
    },

    yTickFormatter: function (d, utilsService) {
      return utilsService.mbToHumanSize(parseInt(d, 10) / (1024 * 1024)).replace('GB', '');
    }

  });

})();
