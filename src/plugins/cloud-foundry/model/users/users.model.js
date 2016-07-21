(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model
   * @description Users model
   */
  angular
    .module('cloud-foundry.model')
    .run(registerUsersModel);

  registerUsersModel.$inject = [
    'app.model.modelManager',
    'app.api.apiManager'
  ];

  function registerUsersModel(modelManager, apiManager) {
    modelManager.register('cloud-foundry.model.users', new Users(apiManager));
  }

  /**
   * @memberof cloud-foundry.model
   * @name Users
   * @param {app.api.apiManager} apiManager - the API manager
   * @property {app.api.apiManager} apiManager - the API manager
   * @class
   */
  function Users(apiManager) {
    this.apiManager = apiManager;
  }

  angular.extend(Users.prototype, {
    /**
     * @function GetUserSummary
     * @memberof cloud-foundry.model.space
     * @description lists all spaces
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {string} userGuid -
     * @param {object} params - optional parameters
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    GetUserSummary: function (cnsiGuid, userGuid, params) {
      var httpConfig = {
        headers: {'x-cnap-cnsi-list': cnsiGuid}
      };
      return this.apiManager.retrieve('cloud-foundry.api.Users')
        .GetUserSummary(userGuid, params, httpConfig)
        .then(function (response) {
          return response.data[cnsiGuid].resources;
        });
    },

    /**
     * @function listAllAppsForSpace
     * @memberof cloud-foundry.model.space
     * @description lists all spaces
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {object=} params - optional parameters
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    listAllUsers: function (cnsiGuid, params) {
      var httpConfig = {
        headers: {'x-cnap-cnsi-list': cnsiGuid}
      };
      return this.apiManager.retrieve('cloud-foundry.api.Users')
        .ListAllUsers(params, httpConfig)
        .then(function (response) {
          return response.data[cnsiGuid].resources;
        });
    }

  });

})();
