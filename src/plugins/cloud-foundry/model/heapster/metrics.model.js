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
    'app.model.modelManager',
    'app.api.apiManager'
  ];

  function registerVcsModel($q, modelManager, apiManager) {
    modelManager.register('cloud-foundry.model.metrics', new MetricsModel($q, apiManager));
  }

  function MetricsModel($q, apiManager) {
    this.$q = $q;
    this.apiManager = apiManager;
    this.metricsData = {};
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

    getNodes: function () {
      return this.apiManager.retrieve('cloud-foundry.api.metrics')
        .getNodes()
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
          if (that._isErrorResponse(res)) {
            return that.$q.reject(res.data.error);
          }
          // transform in kd-graph format
          return that._addOpenTsdbMetrics(res.data, 'cpu/usage_rate');
        });
    },

    getCpuUtilization: function (filter) {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.metrics')
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
      return this.apiManager.retrieve('cloud-foundry.api.metrics')
        .getMetrics(metricsName, filter)
        .then(function (res) {
          if (that._isErrorResponse(res)) {
            return that.$q.reject(res.data.error);
          }
          // transform in kd-graph format
          return that._addOpenTsdbMetrics(res.data, metricsName);
        });
    },

    getMemoryUsage: function (filter) {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.metrics')
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
      return this.apiManager.retrieve('cloud-foundry.api.metrics')
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
      return this.apiManager.retrieve('cloud-foundry.api.metrics')
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
      return this.apiManager.retrieve('cloud-foundry.api.metrics')
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
      return this.apiManager.retrieve('cloud-foundry.api.metrics')
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
        lastReading = lastReading.value
      } else {
        lastReading = undefined;
      }
      return lastReading;

    },
    getNodeCpuLimit: function (nodeName) {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.metrics')
        .getNodeCpuLimit(nodeName)
        .then(function (res) {
          var lastReading = that._getMostRecentDataPoint(res.data);
          _.set(that.metricsData, nodeName + '.cpuLimit', lastReading);
          return lastReading;
        });
    }
    ,

    getNodeMemoryLimit: function (nodeName) {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.metrics')
        .getNodeMemoryLimit(nodeName)
        .then(function (res) {
          var lastReading = that._getMostRecentDataPoint(res.data);
          _.set(that.metricsData, nodeName + '.memoryLimit', lastReading);
          return lastReading;
        });
    }
    ,

    getNodeUptime: function (nodeName) {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.metrics')
        .getNodeUptime(nodeName)
        .then(function (res) {
          return that._getMostRecentDataPoint(res.data);
        });
    }
    ,

    getNetworkRxRate: function (nodeName) {
      var that = this;

      return this.apiManager.retrieve('cloud-foundry.api.metrics')
        .getNetworkRxRate(nodeName)
        .then(function (res) {
          return that._getMostRecentDataPoint(res.data);
        });
    }
    ,

    getNetworkTxRate: function (nodeName) {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.metrics')
        .getNetworkTxRate(nodeName)
        .then(function (res) {
          return that._getMostRecentDataPoint(res.data);
        });
    }
    ,

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

      if (!_.isEqual(keys, _.keys(dpsArray[1]))) {
        console.log('Keys are not equal!');
      }

      var mergedDpsArray = {};
      _.each(keys, function (key) {
        var values = _.map(dpsArray, key);
        mergedDpsArray[key] = _.sum(values);
      });

      var metricsDataObject = metricsDataArray[0];
      metricsDataObject.dps = mergedDpsArray;
      return [metricsDataObject];
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
    ,

    _isErrorResponse: function (res) {
      return _.has(res, 'data.error');
    }
  })
  ;

})();
