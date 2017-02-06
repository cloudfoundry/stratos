(function () {
  'use strict';

  angular
    .module('service-manager.view.service.detail.instances', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('sm.endpoint.detail.instances', {
      url: '/instances',
      templateUrl: 'plugins/service-manager/view/service/detail/instances/service-manager.instances.html',
      controller: ServiceManagerInstancesController,
      controllerAs: 'instancesCtrl',
      ncyBreadcrumb: {
        label: '{{ smCtrl.endpoint.name || "..." }}',
        parent: 'sm.endpoint.detail'
      }
    });
  }

  ServiceManagerInstancesController.$inject = [
    '$state',
    '$stateParams',
    '$interval',
    '$q',
    'app.model.modelManager',
    'app.utils.utilsService'
  ];

  function ServiceManagerInstancesController($state, $stateParams, $interval, $q, modelManager, utilsService) {

    var that = this;

    this.$state = $state;
    this.$q = $q;
    this.metricsModel = modelManager.retrieve('cloud-foundry.model.metrics');

    this.instances = [];
    var guid = $stateParams.guid;
    this.hsmModel = modelManager.retrieve('service-manager.model');

    this.cpuUsageRate = {};
    this.memoryUsageRate = {};

    function init() {
      return that.hsmModel.getModel(guid).then(function (model) {
        that.instances = model.instances;
        return that._fetchInstanceMetrics();
      });
    }

    utilsService.chainStateResolve('sm.endpoint.detail.instances', $state, init);

    $interval(function () {
      that._fetchInstanceMetrics();
    }, 60000);

  }

  angular.extend(ServiceManagerInstancesController.prototype, {
    open: function (endpoint) {
      this.$state.go('sm.endpoint.instance.components', {id: endpoint.instance_id});
    },

    _fetchInstanceMetrics: function () {

      var that = this;
      var metricsPromises = [];

      _.each(this.instances, function (instance) {
        metricsPromises.push(that.updateCpuRate(instance.instance_id));
        metricsPromises.push(that.updateMemoryRate(instance.instance_id));
      });

      return this.$q.all(metricsPromises);
    },

    updateCpuRate: function (namespaceName) {
      var that = this;
      return this.metricsModel.getCpuUsageRate(this.metricsModel.makeNameSpaceFilter(namespaceName))
        .then(function (metricsData) {
          if (_.has(metricsData, 'timeSeries')) {
            that.cpuUsageRate[namespaceName] = metricsData.timeSeries;
          }
        });
    },
    updateMemoryRate: function (namespaceName) {
      var that = this;
      return this.metricsModel.getMemoryWorkingSetUsasge(this.metricsModel.makeNameSpaceFilter(namespaceName))
        .then(function (metricsData) {
          if (_.has(metricsData, 'timeSeries')) {
            that.memoryUsageRate[namespaceName] = metricsData.timeSeries;
          }
        });
    }

  });

})();
