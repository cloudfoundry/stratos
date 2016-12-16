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
    apiManager.register('cloud-foundry.api.Vcs', new VcsApi($http, $httpParamSerializer));
  }

  /**
   * @memberof cloud-foundry.api.Vcs
   * @name VcsApi
   * @param {object} $http - the Angular $http service
   * @param {object} $httpParamSerializer - the Angular $httpParamSerializer service
   * @property {object} $http - the Angular $http service
   * @property {string} vcsApiUrl - the VCS API endpoint
   * @class
   */
  function VcsApi($http, $httpParamSerializer) {
    this.$http = $http;
    this.$httpParamSerializer = $httpParamSerializer;
    this.vcsApiUrl = '/pp/v1/vcs/';
  }

  angular.extend(VcsApi.prototype, {
    /**
     * @function listVcsClients
     * @memberof cloud-foundry.api.Vcs.VcsApi
     * @description Get the list of valid VCS clients
     * @returns {promise} A promise object
     * @public
     */
    listVcsClients: function () {
      var url = this.vcsApiUrl + 'clients';
      return this.$http.get(url);
    },

    registerVcsToken: function (vcsGuid, tokenName, tokenValue) {
      var url = this.vcsApiUrl + 'pat';
      var config = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };
      var data = this.$httpParamSerializer({
        name: tokenName,
        vcs_guid: vcsGuid,
        token: tokenValue
      });
      return this.$http.post(url, data, config);
    },

    renameVcsToken: function (tokenGuid, tokenName) {
      var url = this.vcsApiUrl + 'pat/' + tokenGuid;
      var config = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };
      var data = this.$httpParamSerializer({name: tokenName});
      return this.$http.put(url, data, config);
    },

    checkVcsToken: function (tokenGuid) {
      return this.$http.get(this.vcsApiUrl + 'pat/' + tokenGuid + '/check');
    },

    deleteVcsToken: function (tokenGuid) {
      return this.$http.delete(this.vcsApiUrl + 'pat/' + tokenGuid);
    },

    listVcsTokens: function () {
      return this.$http.get(this.vcsApiUrl + 'pat');
    }

  });

})();
