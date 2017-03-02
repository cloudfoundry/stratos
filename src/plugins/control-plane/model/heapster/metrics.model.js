(function () {
  'use strict';

  /**
   * @namespace control-plane.model.metrics
   * @memberOf control-plane.model
   * @name metrics
   * @description Heapster Metrics
   */
  angular
    .module('control-plane.model')
    .run(registerMetricsModel);

  registerMetricsModel.$inject = [
    '$q',
    'app.model.modelManager',
    'app.api.apiManager'
  ];

  function registerMetricsModel($q, modelManager, apiManager) {
    modelManager.register('control-plane.model.metrics', new MetricsModel($q, apiManager));
  }

  function MetricsModel($q, apiManager) {
    this.$q = $q;
    this.apiManager = apiManager;
    this.metricsData = {};
  }

  angular.extend(MetricsModel.prototype, {

    getNamespaceNames: function () {
      return this.apiManager.retrieve('control-plane.api.metrics')
        .getNamespaceNames()
        .then(function (res) {
          return res.data;
        });
    },

    getNodes: function () {
      return this.apiManager.retrieve('control-plane.api.metrics')
        .getNodes()
        .then(function (res) {
          return res.data;
        });
    },

    getPodsByNamespace: function (namespaceName) {
      return this.apiManager.retrieve('control-plane.api.metrics')
        .getPodsByNamespace(namespaceName)
        .then(function (res) {
          return res.data;
        });
    },

    getCpuUsageRate: function (filter) {
      var that = this;
      return this.apiManager.retrieve('control-plane.api.metrics')
        .getCpuUsage(filter)
        .then(function (res) {
          if (that._isErrorResponse(res)) {
            return that.$q.reject(res.data.error);
          }
          // transform in kd-graph format
          return that._addOpenTsdbMetrics(res.data, 'cpu/usage_rate');
        });
    },

    getCpuUtilization: function (filter) {
      var that = this;
      return this.apiManager.retrieve('control-plane.api.metrics')
        .getCpuUtilization(filter)
        .then(function (res) {
          if (that._isErrorResponse(res)) {
            return that.$q.reject(res.data.error);
          }
          // transform in kd-graph format
          return that._addOpenTsdbMetrics(res.data, 'cpu/utilization');
        });
    },

    getMetrics: function (metricsName, filter) {
      var that = this;
      return this.apiManager.retrieve('control-plane.api.metrics')
        .getMetrics(metricsName, filter)
        .then(function (res) {
          if (that._isErrorResponse(res)) {
            return that.$q.reject(res.data.error);
          }
          // transform in kd-graph format
          return that._addOpenTsdbMetrics(res.data, metricsName);
        });
    },
    getLatestMetricDataPoint: function (metricsName, filter) {
      return this.getMetrics(metricsName, filter)
        .then(function (metricsData) {
          return _.last(metricsData.dataPoints).y;
        });
    },

    getMemoryUsage: function (filter) {
      var that = this;
      return this.apiManager.retrieve('control-plane.api.metrics')
        .getMemoryUsage(filter)
        .then(function (res) {
          if (that._isErrorResponse(res)) {
            return that.$q.reject(res.data.error);
          }
          // transform in kd-graph format
          return that._addOpenTsdbMetrics(res.data, 'memory/usage');
        });
    },

    getMemoryWorkingSetUsasge: function (filter) {
      var that = this;
      return this.apiManager.retrieve('control-plane.api.metrics')
        .getMemoryWorkingSetUsasge(filter)
        .then(function (res) {
          if (that._isErrorResponse(res)) {
            return that.$q.reject(res.data.error);
          }
          // transform in kd-graph format
          return that._addOpenTsdbMetrics(res.data, 'memory_working_set_gauge');
        });
    },

    getMemoryUtilization: function (filter) {
      var that = this;
      return this.apiManager.retrieve('control-plane.api.metrics')
        .getMemoryUtilization(filter)
        .then(function (res) {
          if (that._isErrorResponse(res)) {
            return that.$q.reject(res.data.error);
          }
          // transform in kd-graph format
          return that._addOpenTsdbMetrics(res.data, 'memory/utilization');
        });
    },

    getNetworkDataTransmitted: function (filter) {
      var that = this;
      return this.apiManager.retrieve('control-plane.api.metrics')
        .getNetworkDataTransmitted(filter)
        .then(function (res) {
          if (that._isErrorResponse(res)) {
            return that.$q.reject(res.data.error);
          }
          // transform in kd-graph format
          return that._addOpenTsdbMetrics(res.data, 'network_tx_cumulative');
        });
    },

    getNetworkDataReceived: function (filter) {
      var that = this;
      return this.apiManager.retrieve('control-plane.api.metrics')
        .getNetworkDataReceived(filter)
        .then(function (res) {
          if (that._isErrorResponse(res)) {
            return that.$q.reject(res.data.error);
          }
          // transform in kd-graph format
          return that._addOpenTsdbMetrics(res.data, 'network_rx_cumulative');
        });
    },

    _getMostRecentDataPoint: function (data) {
      var getLastMetricReading = data.latestTimestamp;

      var lastReading = _.find(data.metrics, {timestamp: getLastMetricReading});

      if (lastReading || _.has(lastReading, 'value')) {
        lastReading = lastReading.value;
      } else {
        lastReading = undefined;
      }
      return lastReading;

    },
    getNodeCpuLimit: function (nodeName) {
      var that = this;
      return this.apiManager.retrieve('control-plane.api.metrics')
        .getNodeCpuLimit(nodeName)
        .then(function (res) {
          var lastReading = that._getMostRecentDataPoint(res.data);
          _.set(that.metricsData, nodeName + '.cpuLimit', lastReading);
          return lastReading;
        });
    },

    getNodeMemoryLimit: function (nodeName) {
      var that = this;
      return this.apiManager.retrieve('control-plane.api.metrics')
        .getNodeMemoryLimit(nodeName)
        .then(function (res) {
          var lastReading = that._getMostRecentDataPoint(res.data);
          _.set(that.metricsData, nodeName + '.memoryLimit', lastReading);
          return lastReading;
        });
    },

    getNodeUptime: function (nodeName) {
      var that = this;
      return this.apiManager.retrieve('control-plane.api.metrics')
        .getNodeUptime(nodeName)
        .then(function (res) {
          return that._getMostRecentDataPoint(res.data);
        });
    },

    getNetworkRxRate: function (nodeName) {
      var that = this;

      return this.apiManager.retrieve('control-plane.api.metrics')
        .getNetworkRxRate(nodeName)
        .then(function (res) {
          return that._getMostRecentDataPoint(res.data);
        });
    },

    getNetworkTxRate: function (nodeName) {
      var that = this;
      return this.apiManager.retrieve('control-plane.api.metrics')
        .getNetworkTxRate(nodeName)
        .then(function (res) {
          return that._getMostRecentDataPoint(res.data);
        });
    },

    _addOpenTsdbMetrics: function (data, metricName) {

      var dataSeriesArray = data;
      if (data.length > 1) {
        dataSeriesArray = this.mergeSeries(dataSeriesArray);
      }

      var responseData = dataSeriesArray[0];

      var dataPoints = [];
      // For spark lines
      var timeSeries = [];
      if (_.has(responseData, 'dps')) {
        _.each(responseData.dps, function (dataPoint, timestamp) {
          dataPoints.push({
            x: parseInt(timestamp, 10),
            y: dataPoint
          });
          timeSeries.push({
            timestamp: parseInt(timestamp, 10) * 1000,
            value: dataPoint
          });
        });
      }

      var cumulativeMetricObj = {
        metricName: metricName,
        aggregation: 'max',
        dataPoints: dataPoints,
        timeSeries: timeSeries,
        lastUpdate: Date.now()
      };

      return cumulativeMetricObj;
    },

    makeNameSpaceFilter: function (namespaceName) {
      return '{namespace_name=' + namespaceName + '}';
    },
    makePodFilter: function (namespaceName, podName) {
      return '{namespace_name=' + namespaceName + ',pod_name=' + podName + '}';
    },

    makeNodeNameFilter: function (nodeName) {
      return '{nodename=' + nodeName + '}';
    },

    mergeSeries: function (metricsDataArray) {

      var dpsArray = _.map(metricsDataArray, 'dps');
      var keys = _.keys(dpsArray[0]);

      var mergedDpsArray = {};
      _.each(keys, function (key) {
        var values = _.map(dpsArray, key);
        values = _.without(values, undefined);
        if (values.length !== dpsArray.length) {
          // Skip dps since not nodes have data at this time
          return;
        }
        mergedDpsArray[key] = _.sum(values);
      });

      var metricsDataObject = metricsDataArray[0];
      metricsDataObject.dps = mergedDpsArray;
      return [metricsDataObject];
    },

    _isErrorResponse: function (res) {
      return _.has(res, 'data.error');
    }
  });

})();
