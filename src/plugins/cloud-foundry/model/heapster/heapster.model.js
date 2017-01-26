(function () {
  'use strict';


  /**
   * @namespace cloud-foundry.model.heapster
   * @memberOf cloud-foundry.model
   * @name vcs
   * @description VCS model
   */
  angular
    .module('cloud-foundry.model')
    .run(registerVcsModel);

  registerVcsModel.$inject = [
    '$q',
    '$interval',
    'app.model.modelManager',
    'app.api.apiManager'
  ];

  function registerVcsModel($q, $interval, modelManager, apiManager) {
    modelManager.register('cloud-foundry.model.metrics', new MetricsModel($q, $interval, apiManager));
  }

  /**
   * @memberof cloud-foundry.model.vcs
   * @name VcsModel
   * @param {object} $q - the Angular $q service
   * @param {app.api.apiManager} apiManager - the application API manager
   * @property {object} $q - the Angular $q service
   * @property {app.api.apiManager} apiManager - the application API manager
   * @property {Array} vcsClients - the list of VCS clients
   * @property {Array} supportedVcsInstances - the list of supported VCS instances
   * @class
   */
  function MetricsModel($q, $interval, apiManager) {
    this.$q = $q;
    this.apiManager = apiManager;
    this.cumulativeMetrics = [];
    this.namespaceInformation = {};
  }

  angular.extend(MetricsModel.prototype, {

    getNamespaceNames: function () {
      return this.apiManager.retrieve('cloud-foundry.api.metrics')
        .getNamespaceNames()
        .then(function (res) {
          return res.data;
        });
    },

    getPodsByNamespace: function (namespaceName) {
      return this.apiManager.retrieve('cloud-foundry.api.metrics')
        .getPodsByNamespace(namespaceName)
        .then(function (res) {
          return res.data;
        });
    },

    getCpuUsageRate: function (filter) {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.metrics')
        .getCpuUsage(filter)
        .then(function (res) {
          // transform in kd-graph format
          return that._addOpenTsdbMetrics(res.data, 'cpu/usage_rate' + (filter ? filter : ''));
        });
    },

    getMemoryUsage: function (filter) {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.metrics')
        .getMemoryUsage(filter)
        .then(function (res) {
          // transform in kd-graph format
          return that._addOpenTsdbMetrics(res.data, 'memory/usage' + (filter ? filter : ''));
        });
    },

    _addOpenTsdbMetrics: function (data, metricName) {

      var responseData = data[0];
      var dataPoints = [];
      // For spark lines
      var timeSeries = [];
      if (_.has(responseData, 'dps')) {
        _.each(responseData.dps, function (dataPoint, timestemp) {
          dataPoints.push({
            x: parseInt(timestemp),
            y: dataPoint
          });
          timeSeries.push({
            timestamp: moment(parseInt(timestemp)).format('YYYY-MM-DDTHH:mm:ssZ'),
            value: dataPoint
          });
        });
      }

      var cumulativeMetricObj = {
        metricName: metricName,
        aggregation: 'sum',
        dataPoints: dataPoints,
        timeSeries: timeSeries
      };
      var index = _.findIndex(this.cumulativeMetrics, ['metricName', metricName]);
      if (index !== -1) {
        this.cumulativeMetrics[index].dataPoints = dataPoints;
        this.cumulativeMetrics[index].timeSeries = timeSeries;
        cumulativeMetricObj = this.cumulativeMetrics[index];
      } else {
        this.cumulativeMetrics.push({
          metricName: metricName,
          aggregation: 'sum',
          dataPoints: dataPoints,
          timeSeries: timeSeries
        });
      }
      return cumulativeMetricObj;
    },

    makeNameSpaceFilter: function (namespaceName) {
      return '{namespace_name=' + namespaceName + '}';
    },
    makePodFilter: function (namespaceName, podName) {
      return '{namespace_name=' + namespaceName + ',pod_name=' + podName + '}';
    },

    retrieveNamespaceInformation: function () {
      var that = this;
      return this.getNamespaceNames().then(function (namespaceNames) {

        var promises = [];
        _.each(namespaceNames, function (namespace) {

          promises.push(that.getPodsByNamespace(namespace)
            .then(function (pods) {
              var podsList = [];
              _.each(pods, function (pod) {
                podsList.push({
                  podName: pod
                });
              });
              return podsList;
            })
            .then(function (podsList) {
              return {
                namespaceName: namespace,
                pods: podsList
              };
            }));
        });
        return that.$q.all(promises);
      }).then(function (namespaceList) {
        var obj = {};
        _.each(namespaceList, function (namespace) {
          obj[namespace.namespaceName] = namespace;
        });
        that.namespaceInformation = obj;
        return obj;
      });
    }
  });

})();
