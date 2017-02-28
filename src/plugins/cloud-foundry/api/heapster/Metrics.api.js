(function () {
  'use strict';

  angular
    .module('cloud-foundry.api')
    .run(registerVcsApi);

  registerVcsApi.$inject = [
    '$http',
    '$httpParamSerializer',
    'app.api.apiManager'
  ];

  function registerVcsApi($http, $httpParamSerializer, apiManager) {
    apiManager.register('cloud-foundry.api.metrics', new MetricsApi($http, $httpParamSerializer));
  }

  function MetricsApi($http, $httpParamSerializer) {

    this.$httpParamSerializer = $httpParamSerializer;

    var metricsUrl = '/pp/v1/metrics/';

    // Exports
    this.getNamespaceNames = getNamespaceNames;
    this.getPodsByNamespace = getPodsByNamespace;
    this.getNamespaceNames = getNamespaceNames;
    this.getNodeUptime = getNodeUptime;
    this.getNodeCpuLimit = getNodeCpuLimit;
    this.getNodeMemoryLimit = getNodeMemoryLimit;
    this.getNetworkRxRate = getNetworkRxRate;
    this.getNetworkTxRate = getNetworkTxRate;
    this.getNodes = getNodes;
    this.getCpuUsage = _metricsQuery('cpu_usage_rate_gauge');
    this.getCpuUtilization = _metricsQuery('cpu_node_utilization_gauge');
    this.getMemoryUsage = _metricsQuery('memory_usage_gauge');
    this.getMemoryWorkingSetUsasge = _metricsQuery('memory_working_set_gauge');
    this.getMemoryUtilization = _metricsQuery('memory_node_utilization_gauge');
    this.getNetworkDataReceived = _metricsQuery('network_rx_cumulative');
    this.getNetworkDataTransmitted = _metricsQuery('network_tx_cumulative');
    this.getNetworkDataReceivedRate = _metricsQuery('network_rx_rate');
    this.getNetworkDataTransmittedRate = _metricsQuery('network_tx_rate_gauge');
    this.getMetrics = function (metricName, filter) {
      return _metricsQuery(metricName)(filter);
    };

    function _metricsQuery(metrics) {
      return function (filter, time) {

        if (!time) {
          time = '24h-ago';
        }
        var url = metricsUrl + 'api/query?start=' + time + '&m=max:' + metrics + (filter ? filter : '');
        return $http.get(url);
      };
    }

    function heapsterNodeQuery(nodeName, metricName) {
      var url = metricsUrl + 'api/v1/model/nodes/' + nodeName + '/metrics/' + metricName;
      return $http.get(url);
    }

    function getNamespaceNames() {
      var url = metricsUrl + 'api/v1/model/namespaces/';
      return $http.get(url);

    }

    function getPodsByNamespace(namespaceName) {
      var url = metricsUrl + 'api/v1/model/namespaces/' + namespaceName + '/pods/';
      return $http.get(url);
    }

    function getNodes() {
      var url = metricsUrl + 'api/v1/model/nodes';
      return $http.get(url);
    }

    function getNodeCpuLimit(nodeName) {
      return heapsterNodeQuery(nodeName, 'cpu/node_capacity');
    }

    function getNodeMemoryLimit(nodeName) {
      return heapsterNodeQuery(nodeName, 'memory/node_capacity');
    }

    function getNodeUptime(nodeName) {
      return heapsterNodeQuery(nodeName, 'uptime');
    }
    function getNetworkRxRate(nodeName) {
      return heapsterNodeQuery(nodeName, 'network/rx_rate');
    }
    function getNetworkTxRate(nodeName) {
      return heapsterNodeQuery(nodeName, 'network/tx_rate');
    }

  }

})();
