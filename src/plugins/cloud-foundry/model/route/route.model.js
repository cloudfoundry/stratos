(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model
   * @description Route model
   */
  angular
    .module('cloud-foundry.model')
    .run(registerRouteModel);

  registerRouteModel.$inject = [
    'app.model.modelManager',
    'app.api.apiManager'
  ];

  function registerRouteModel(modelManager, apiManager) {
    modelManager.register('cloud-foundry.model.route', new Route(apiManager));
  }

  /**
   * @memberof cloud-foundry.model
   * @name Route
   * @param {app.api.apiManager} apiManager - the API manager
   * @property {app.api.apiManager} apiManager - the API manager
   * @property {object} route - the currently selected route state
   * @class
   */
  function Route(apiManager) {
    this.apiManager = apiManager;
    this.route = {};
  }

  angular.extend(Route.prototype, {
   /**
    * @function associateAppWithRoute
    * @memberof cloud-foundry.model.route
    * @description associate app with the route
    * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
    * @param {string} guid - route identifier
    * @param {string} appGuid - app identifier
    * @returns {promise} A resolved/rejected promise
    * @public
    */
    associateAppWithRoute: function (cnsiGuid, guid, appGuid) {
      var httpConfig = {
        headers: { 'x-cnap-cnsi-list': cnsiGuid }
      };
      return this.apiManager.retrieve('cloud-foundry.api.Routes')
        .AssociateAppWithRoute(guid, appGuid, {}, httpConfig);
    },

   /**
    * @function removeAppFromRoute
    * @memberof cloud-foundry.model.route
    * @description remove app from the route
    * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
    * @param {string} guid - route identifier
    * @param {string} appGuid - app identifier
    * @returns {promise} A resolved/rejected promise
    * @public
    */
    removeAppFromRoute: function (cnsiGuid, guid, appGuid) {
      var httpConfig = {
        headers: { 'x-cnap-cnsi-list': cnsiGuid }
      };
      return this.apiManager.retrieve('cloud-foundry.api.Routes')
        .RemoveAppFromRoute(guid, appGuid, {}, httpConfig);
    },

    createRoute: function (cnsiGuid, routeSpec) {
      var httpConfig = {
        headers: { 'x-cnap-cnsi-list': cnsiGuid }
      };
      return this.apiManager.retrieve('cloud-foundry.api.Routes')
        .CreateRoute(routeSpec, {}, httpConfig)
        .then(function (response) {
          return response.data[cnsiGuid];
        });
    },

   /**
    * @function deleteApp
    * @memberof cloud-foundry.model.route
    * @description deletes a particular route
    * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
    * @param {string} guid - route identifier
    * @param {boolean} recursive - flag for recursive delete or not (not currently used by sub-code)
    * @returns {promise} A resolved/rejected promise
    * @public
    */
    deleteRoute: function (cnsiGuid, guid, recursive) {
      var httpConfig = {
        headers: { 'x-cnap-cnsi-list': cnsiGuid }
      };
      return this.apiManager.retrieve('cloud-foundry.api.Routes')
        .DeleteRoute(guid, recursive, {}, httpConfig);
    },

   /**
    * @function listAllAppsForRoute
    * @memberof cloud-foundry.model.route
    * @description lists all apps for the route and store the response in the model
    * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
    * @param {string} guid - route identifier
    * @param {object} params - optional parameters
    * @returns {promise} A resolved/rejected promise
    * @public
    */
    listAllAppsForRoute: function (cnsiGuid, guid, params) {
      var that = this;
      var httpConfig = {
        headers: { 'x-cnap-cnsi-list': cnsiGuid }
      };
      return this.apiManager.retrieve('cloud-foundry.api.Routes')
        .ListAllAppsForRoute(guid, params, httpConfig)
        .then(function (response) {
          that.route.id = guid;
          that.route.apps = response.data[cnsiGuid];
        });
    },

   /**
    * @function listAllAppsForRouteWithoutStore
    * @memberof cloud-foundry.model.route
    * @description get all apps for the route
    * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
    * @param {string} guid - route identifier
    * @param {object} params - optional parameters
    * @returns {promise} A resolved/rejected promise
    * @public
    */
    listAllAppsForRouteWithoutStore: function (cnsiGuid, guid, params) {
      var httpConfig = {
        headers: { 'x-cnap-cnsi-list': cnsiGuid }
      };
      return this.apiManager.retrieve('cloud-foundry.api.Routes')
        .ListAllAppsForRoute(guid, params, httpConfig)
        .then(function (response) {
          return response.data[cnsiGuid].resources;
        });
    }
  });

})();
