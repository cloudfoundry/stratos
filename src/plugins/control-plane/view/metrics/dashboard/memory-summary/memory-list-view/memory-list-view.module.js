(function () {
  'use strict';

  angular
    .module('control-plane.view.metrics.dashboard.memory-summary.list', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cp.metrics.dashboard.memory-summary.list', {
      url: '/list',
      params: {
        guid: ''
      },
      controller: ListViewController,
      controllerAs: 'listViewCtrl',
      scope: {},
      templateUrl: 'plugins/control-plane/view/metrics/dashboard/memory-summary/memory-list-view/memory-list-view.html'

    });
  }

  ListViewController.$inject = [
    '$q',
    '$state',
    '$stateParams',
    'app.model.modelManager',
    'app.utils.utilsService'
  ];

  function ListViewController($q, $state, $stateParams, modelManager, utilsService) {

    var that = this;
    this.metricsModel = modelManager.retrieve('cloud-foundry.model.metrics');
    var controlPlaneModel = modelManager.retrieve('control-plane.model');
    this.guid = $stateParams.guid;
    this.$q = $q;
    this.nodes = [];


    this.tableColumns = [
      {name: gettext('Node'), value: 'spec.hostname'},
      {name: gettext('Memory Usage'), value: 'metrics.memory_usage', noSort: true},
      {name: gettext('Memory Spark Line'), value: 'metrics.memory_usage', descendingFirst: true},
    ];

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
        })
        .then(function () {
          // Enrich nodes information

          var allMetricPromises = [];
          _.each(that.nodes, function (node, key) {

            var metricPromises = [];
            metricPromises.push(that.metricsModel.getLatestMetricDataPoint('memory_node_utilization_gauge',
              that.metricsModel.makeNodeNameFilter(node.spec.hostname)));

            var promises = $q.all(metricPromises)
              .then(function (metrics) {
                that.nodes[key].metrics = {};
                that.nodes[key].metrics.memory_usage = (metrics[0] * 100).toFixed(2);
              });

            allMetricPromises.push(promises);

          });
          return allMetricPromises;
        });
    }

    utilsService.chainStateResolve('cp.metrics.dashboard.summary.list', $state, init);

  }

  angular.extend(ListViewController.prototype, {});

})();
