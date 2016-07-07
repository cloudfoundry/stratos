/* DO NOT EDIT: This code has been generated by swagger-codegen */
(function () {
  'use strict';

  angular
    .module('cloud-foundry.api')
    .run(registerApi);

  registerApi.$inject = [
    '$http',
    'app.api.apiManager'
  ];

  function registerApi($http, apiManager) {
    apiManager.register('cloud-foundry.api.HceVcsApi', new HceVcsApi($http));
  }

  /**
    * @constructor
    * @name HceVcsApi
    * @description For more information on this API, please see:
    * https://github.com/hpcloud/hce-rest-service/blob/master/app/v2/swagger.yml
    * @param {object} $http - the Angular $http service
    * @property {object} $http - the Angular $http service
    * @property {string} baseUrl - the API base URL
    */
  function HceVcsApi($http) {
    this.$http = $http;
    this.baseUrl = '/pp/v1/proxy/v2';
  }

  angular.extend(HceVcsApi.prototype, {
    /**
     * @name addVcs
     * @description Add a VCS instance.
     * @param {string} guid - the HCE instance GUID
     * @param {object} data - the request body
     * @param {object} params - the query parameters
     * @param {object} httpConfigOptions - additional config options
     * @returns {promise} A resolved/rejected promise
     */
    addVcs: function (guid, data, params, httpConfigOptions) {
      var path = this.baseUrl + '/vcs';
      var headers = {
        'x-cnap-cnsi-list': guid
      };

      var config = {
        method: 'POST',
        url: path,
        params: params || {},
        data: data,
        headers: headers
      };

      angular.forEach(httpConfigOptions, function (optionConfig, option) {
        if (option === 'headers') {
          angular.extend(config[option], optionConfig);
        } else {
          config[option] = optionConfig;
        }
      });

      return this.$http(config);
    },

    /**
     * @name getVcs
     * @description Get the specified VCS.
     * @param {string} guid - the HCE instance GUID
     * @param {!number} vcsId - The (HCE) VCS id.
     * @param {object} params - the query parameters
     * @param {object} httpConfigOptions - additional config options
     * @returns {promise} A resolved/rejected promise
     */
    getVcs: function (guid, vcsId, params, httpConfigOptions) {
      var path = this.baseUrl + '/vcs/{vcs_id}'
        .replace('{' + 'vcs_id' + '}', vcsId);
      var headers = {
        'x-cnap-cnsi-list': guid
      };

      var config = {
        method: 'GET',
        url: path,
        params: params || {},
        headers: headers
      };

      angular.forEach(httpConfigOptions, function (optionConfig, option) {
        if (option === 'headers') {
          angular.extend(config[option], optionConfig);
        } else {
          config[option] = optionConfig;
        }
      });

      return this.$http(config);
    },

    /**
     * @name getVcsAuth
     * @description Get the client credentials for the specified VCS.
     * @param {string} guid - the HCE instance GUID
     * @param {!number} vcsId - The (HCE) VCS id.
     * @param {object} params - the query parameters
     * @param {object} httpConfigOptions - additional config options
     * @returns {promise} A resolved/rejected promise
     */
    getVcsAuth: function (guid, vcsId, params, httpConfigOptions) {
      var path = this.baseUrl + '/vcs/{vcs_id}/auth'
        .replace('{' + 'vcs_id' + '}', vcsId);
      var headers = {
        'x-cnap-cnsi-list': guid
      };

      var config = {
        method: 'GET',
        url: path,
        params: params || {},
        headers: headers
      };

      angular.forEach(httpConfigOptions, function (optionConfig, option) {
        if (option === 'headers') {
          angular.extend(config[option], optionConfig);
        } else {
          config[option] = optionConfig;
        }
      });

      return this.$http(config);
    },

    /**
     * @name getVcses
     * @description List VCS instances.
     * @param {string} guid - the HCE instance GUID
     * @param {object} params - the query parameters
     * @param {object} httpConfigOptions - additional config options
     * @returns {promise} A resolved/rejected promise
     */
    getVcses: function (guid, params, httpConfigOptions) {
      var path = this.baseUrl + '/vcs';
      var headers = {
        'x-cnap-cnsi-list': guid
      };

      var config = {
        method: 'GET',
        url: path,
        params: params || {},
        headers: headers
      };

      angular.forEach(httpConfigOptions, function (optionConfig, option) {
        if (option === 'headers') {
          angular.extend(config[option], optionConfig);
        } else {
          config[option] = optionConfig;
        }
      });

      return this.$http(config);
    },

    /**
     * @name listVcsTypes
     * @description List of vcs types, e.g. &#x60;GITHUB&#x60;, &#x60;SVN&#x60;, etc.\n
     * @param {string} guid - the HCE instance GUID
     * @param {object} params - the query parameters
     * @param {object} httpConfigOptions - additional config options
     * @returns {promise} A resolved/rejected promise
     */
    listVcsTypes: function (guid, params, httpConfigOptions) {
      var path = this.baseUrl + '/vcs/types';
      var headers = {
        'x-cnap-cnsi-list': guid
      };

      var config = {
        method: 'GET',
        url: path,
        params: params || {},
        headers: headers
      };

      angular.forEach(httpConfigOptions, function (optionConfig, option) {
        if (option === 'headers') {
          angular.extend(config[option], optionConfig);
        } else {
          config[option] = optionConfig;
        }
      });

      return this.$http(config);
    },

    /**
     * @name removeVcs
     * @description Remove (unregister) the specified VCS.
     * @param {string} guid - the HCE instance GUID
     * @param {!number} vcsId - The (HCE) VCS id.
     * @param {object} params - the query parameters
     * @param {object} httpConfigOptions - additional config options
     * @returns {promise} A resolved/rejected promise
     */
    removeVcs: function (guid, vcsId, params, httpConfigOptions) {
      var path = this.baseUrl + '/vcs/{vcs_id}'
        .replace('{' + 'vcs_id' + '}', vcsId);
      var headers = {
        'x-cnap-cnsi-list': guid
      };

      var config = {
        method: 'DELETE',
        url: path,
        params: params || {},
        headers: headers
      };

      angular.forEach(httpConfigOptions, function (optionConfig, option) {
        if (option === 'headers') {
          angular.extend(config[option], optionConfig);
        } else {
          config[option] = optionConfig;
        }
      });

      return this.$http(config);
    },

    /**
     * @name updateVcs
     * @description Update the specified VCS.
     * @param {string} guid - the HCE instance GUID
     * @param {!number} vcsId - VCS id.
     * @param {object} data - the request body
     * @param {object} params - the query parameters
     * @param {object} httpConfigOptions - additional config options
     * @returns {promise} A resolved/rejected promise
     */
    updateVcs: function (guid, vcsId, data, params, httpConfigOptions) {
      var path = this.baseUrl + '/vcs/{vcs_id}'
        .replace('{' + 'vcs_id' + '}', vcsId);
      var headers = {
        'x-cnap-cnsi-list': guid
      };

      var config = {
        method: 'PUT',
        url: path,
        params: params || {},
        data: data,
        headers: headers
      };

      angular.forEach(httpConfigOptions, function (optionConfig, option) {
        if (option === 'headers') {
          angular.extend(config[option], optionConfig);
        } else {
          config[option] = optionConfig;
        }
      });

      return this.$http(config);
    }
  });
})();
