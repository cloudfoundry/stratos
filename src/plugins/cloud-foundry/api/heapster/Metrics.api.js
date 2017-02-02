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
    this.getNodes = getNodes;
    this.getCpuUsage = _metricsQuery('cpu_usage_rate_gauge');
    this.getCpuUtilization = _metricsQuery('cpu_node_utilization_gauge');
    this.getMemoryUsage = _metricsQuery('memory_usage_gauge');
    this.getMemoryWorkingSetUsasge = _metricsQuery('memory_working_set_gauge');
    this.getMemoryUtilization = _metricsQuery('memory_node_utilization_gauge');
    this.updateNetworkDataReceived = _metricsQuery('network_rx_cumulative');
    this.updateNetworkDataTransmitted = _metricsQuery('network_tx_cumulative');

    function _metricsQuery(metrics) {
      return function (filter, time) {
        if (!time) {
          time = '24h-ago';
        }
        var url = metricsUrl + 'api/query?start=' + time + '&m=sum:' + metrics + (filter ? filter : '');
        return $http.get(url);
      };
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
      var url = metricsUrl + 'api/v1/model/nodes/' + nodeName + '/metrics/cpu/node_capacity';
      return $http.get(url);
    }

    function getNodeMemoryLimit(nodeName) {
      var url = metricsUrl + 'api/v1/model/nodes/' + nodeName + '/metrics/memory/node_capacity';
      return $http.get(url);
    }

    function getNodeUptime(nodeName) {
      var url = metricsUrl + 'api/v1/model/nodes/' + nodeName + '/metrics/uptime';
      return $http.get(url);
    }

  }

})();
