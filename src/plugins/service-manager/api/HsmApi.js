
(function () {
  'use strict';

  //https://github.com/hpcloud/hsm/blob/develop/docs/swagger-spec/api.yml

  angular
    .module('service-manager.api', [])
    .run(registerApi);

  registerApi.$inject = [
    '$http',
    'app.api.apiManager'
  ];

  function registerApi($http, apiManager) {
    apiManager.register('service-manager.api.HsmApi', new HsmApi($http));
  }

  /**
    * @constructor
    * @name HsmApi
    * @description HSM API
    * @param {object} $http - the Angular $http service
    * @property {object} $http - the Angular $http service
    * @property {string} baseUrl - the API base URL
    */
  function HsmApi($http) {
    this.$http = $http;
    this.baseUrl = '/pp/v1/proxy/v1/';
  }

  angular.extend(HsmApi.prototype, {

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

    getTemplate: function (guid, url) {
      var i = url.indexOf('/v1/');
      if (i > 0) {
        url = url.substr(i + 4);
      }
      return this._get(url, guid);
    },

    /**
     * @name instances
     * @description Get the instances for the HSM instance
     * @param {string} guid - the HCE GUID
     * @param {object} httpConfigOptions - additional config options
     * @returns {promise} A resolved/rejected promise
     */
    instances: function (guid, httpConfigOptions) {
      return this._get('instances', guid, httpConfigOptions);
    },

    /**
     * @name instance
     * @description Get the instances for the HSM instance
     * @param {string} guid - the HCE GUID
     * @param {string} id - the id of the instance
     * @param {object} httpConfigOptions - additional config options
     * @returns {promise} A resolved/rejected promise
     */
    instance: function (guid, id, httpConfigOptions) {
      return this._get('instances/' + id, guid, httpConfigOptions);
    },

    /**
     * @name services
     * @description Get the services for the HSM instance
     * @param {string} guid - the HCE instance GUID
     * @param {object} httpConfigOptions - additional config options
     * @returns {promise} A resolved/rejected promise
     */
    services: function (guid, httpConfigOptions) {
      return this._get('services', guid, httpConfigOptions);
    },

    /**
     * @name service
     * @description Get the services for the HSM instance
     * @param {string} guid - the HCE instance GUID
     * @param {string} id - the id of the service to get
     * @param {object} httpConfigOptions - additional config options
     * @returns {promise} A resolved/rejected promise
     */
    service: function (guid, id, httpConfigOptions) {
      return this._get('services/' + id, guid, httpConfigOptions);
    },

    serviceSdl: function (guid, id, productVersion, sdlVersion, httpConfigOptions) {
      return this._get('services/' + id + '/product_versions/' + productVersion + '/sdl_versions/' + sdlVersion, guid, httpConfigOptions);
    },

    serviceProduct: function (guid, id, productVersion, httpConfigOptions) {
      return this._get('services/' + id + '/product_versions/' + productVersion, guid, httpConfigOptions);
    },

    createInstance: function (guid, id, productVersion, sdlVersion, instanceId, params, httpConfigOptions) {
      var instanceRequest = {
        service_id: id,
        product_version: productVersion,
        sdl_version: sdlVersion,
        parameters: []
      };

      if (instanceId) {
        instanceRequest.instance_id = instanceId;
      }

      _.each(params, function (value, key) {
        instanceRequest.parameters.push({
          name: key,
          value: value
        });
      });
      return this._post('instances', guid, instanceRequest, httpConfigOptions);
    },

    deleteInstance: function (guid, id, httpConfigOptions) {
      return this._request('DELETE', 'instances/' + id, guid, undefined, httpConfigOptions);
    },

    // Note this is used for both upgrade and configure
    configureInstance: function (guid, instance, params, httpConfigOptions) {
      var instanceRequest = {
        instance_id: instance.instance_id,
        service_id: instance.service_id,
        vendor: instance.vendor,
        product_version: instance.product_version,
        sdl_version: instance.sdl_version,
        parameters: []
      };

      _.each(params, function (value, key) {
        instanceRequest.parameters.push({
          name: key,
          value: value
        });
      });

      return this._request('PUT', 'instances/' + instance.instance_id, guid, instanceRequest, httpConfigOptions);
    },

    info: function (guids, httpConfigOptions) {
      return this._get('info', guids, _.set(httpConfigOptions || {}, 'headers.x-cnap-passthrough', 'false'));
    }

  });
})();
