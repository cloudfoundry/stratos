(function () {
  'use strict';

  //https://github.com/hpcloud/hdp-resource-manager/blob/develop/api/ipmgr/swagger.yml
  //https://github.com/hpcloud/hdp-resource-manager/blob/develop/api/rpmgr/swagger.yml

  angular
    .module('control-plane.api', [])
    .run(registerApi);

  registerApi.$inject = [
    '$http',
    'app.api.apiManager'
  ];

  function registerApi($http, apiManager) {
    apiManager.register('control-plane.api.HcpApi', new HcpApi($http));
  }

  function HcpApi($http) {
    this.$http = $http;
    this.baseUrl = '/pp/v1/proxy/v1/';
  }

  angular.extend(HcpApi.prototype, {

    _get: function (path, guid, httpConfigOptions) {
      return this._request('GET', path, guid, undefined, httpConfigOptions);
    },

    _post: function (path, guid, data, httpConfigOptions) {
      return this._request('POST', path, guid, data, httpConfigOptions);
    },

    _request: function (method, path, guid, data, httpConfigOptions) {
      var url = this.baseUrl + path;
      var headers = {
        'x-cnap-cnsi-list': guid,
        'x-cnap-passthrough': 'true'
      };

      var config = {
        method: method,
        data: data,
        url: url,
        params: {},
        headers: headers
      };

      angular.forEach(httpConfigOptions, function (optionConfig, option) {
        if (option === 'headers') {
          angular.extend(config[option], optionConfig);
        } else {
          config[option] = optionConfig;
        }
      });

      return this.$http(config).then(function (response) {
        return response.data;
      });
    },

    computes: function (guid, id, httpConfigOptions) {
      if (id) {
        return this._get('compute/' + id, guid, httpConfigOptions);
      }
      return this._get('compute', guid, httpConfigOptions);
    },

    instances: function (guid, id, httpConfigOptions) {
      if (id) {
        return this._get('instances/' + id, guid, httpConfigOptions);
      }
      return this._get('instances', guid, httpConfigOptions);

    },

    tasks: function (guid, id, httpConfigOptions) {
      if (id) {
        return this._get('tasks/' + id, guid, httpConfigOptions);
      }
      return this._get('tasks', guid, httpConfigOptions);

    },

    usage: function (guid, httpConfigOptions) {
      return this._get('usage', guid, httpConfigOptions);
    }

  });
})();
