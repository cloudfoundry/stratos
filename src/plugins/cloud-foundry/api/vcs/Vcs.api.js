(function () {
  'use strict';

  angular
    .module('cloud-foundry.api')
    .run(registerVcsApi);

  registerVcsApi.$inject = [
    '$http',
    'app.api.apiManager'
  ];

  function registerVcsApi($http, apiManager) {
    apiManager.register('cloud-foundry.api.Vcs', new VcsApi($http));
  }

  /**
   * @memberof cloud-foundry.api.Vcs
   * @name VcsApi
   * @param {object} $http - the Angular $http service
   * @property {object} $http - the Angular $http service
   * @property {string} vcsApiUrl - the VCS API endpoint
   * @class
   */
  function VcsApi($http) {
    this.$http = $http;
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
    }
  });

})();
