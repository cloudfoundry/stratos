(function () {
  'use strict';

  angular
    .module('control-plane.view.metrics.dashboard')
    .directive('cpuCard', cpuCard);

  function cpuCard() {
    return {
      bindToController: {
        node: '@',
        metricsNodeName: '@',
        showUtilizationDonut: '=',
        title: '@',
        nodeMetrics: '='
      },
      controller: CpuCardController,
      controllerAs: 'cpuCardCtrl',
      scope: {},
      templateUrl: 'plugins/control-plane/view/metrics/dashboard/cpu-summary/cpu-card/cpu-card.html'
    };
  }

  CpuCardController.$inject = [
    '$q',
    '$state',
    'app.model.modelManager'
  ];

  function CpuCardController($q, $state, modelManager) {

    this.metricsModel = modelManager.retrieve('control-plane.model.metrics');
    this.$state = $state;
    this.$q = $q;
    this.cardData = {
      title: this.title
    };

  }

  angular.extend(CpuCardController.prototype, {

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

    yTickFormatter: function (d) {
      return d;
    }

  });

})();
