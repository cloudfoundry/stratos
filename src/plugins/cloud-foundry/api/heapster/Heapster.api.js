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

    var that = this;
    this.$httpParamSerializer = $httpParamSerializer;

    // TODO no portal-proxy integration yet
    var heapsterApiUrl = '/metrics/heapster/';
    var opentsdbApiUrl = '/metrics/opentsdb/';

    // Exports
    this.getNamespaceNames = getNamespaceNames;
    this.getPodsByNamespace = getPodsByNamespace;
    this.getNamespaceNames = getNamespaceNames;
    this.getCpuUsage = _metricsQuery('cpu_usage_rate_gauge');
    this.getMemoryUsage = _metricsQuery('memory_usage_gauge');

    function _metricsQuery(metrics) {
      return function (filter, time) {
        if (!time) {
          time = '24h-ago';
        }
        var url = opentsdbApiUrl + 'api/query?start=' + time + '&m=sum:' + metrics + (filter ? filter : '');
        return $http.get(url);
      };
    }

    function getNamespaceNames() {
      var url = heapsterApiUrl + 'api/v1/model/namespaces/';
      return $http.get(url);

    }

    function getPodsByNamespace(namespaceName) {
      var url = heapsterApiUrl + 'api/v1/model/namespaces/' + namespaceName + '/pods/';
      return $http.get(url);
    }

  }

})();
