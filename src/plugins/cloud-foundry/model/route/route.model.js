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
    * @param {string} guid - route identifier
    * @param {string} appGuid - app identifier
    * @returns {promise} A resolved/rejected promise
    * @public
    */
    associateAppWithRoute: function (guid, appGuid) {
      return this.apiManager.retrieve('cloud-foundry.api.Routes')
        .AssociateAppWithRoute(guid, appGuid);
    },

   /**
    * @function removeAppFromRoute
    * @memberof cloud-foundry.model.route
    * @description remove app from the route
    * @param {string} guid - route identifier
    * @param {string} appGuid - app identifier
    * @returns {promise} A resolved/rejected promise
    * @public
    */
    removeAppFromRoute: function (guid, appGuid) {
      return this.apiManager.retrieve('cloud-foundry.api.Routes')
        .RemoveAppFromRoute(guid, appGuid);
    },

   /**
    * @function deleteApp
    * @memberof cloud-foundry.model.route
    * @description deletes a particular route
    * @param {string} guid - route identifier
    * @returns {promise} A resolved/rejected promise
    * @public
    */
    deleteRoute: function (guid) {
      return this.apiManager.retrieve('cloud-foundry.api.Routes')
        .DeleteRoute(guid);
    },

   /**
    * @function listAllAppsForRoute
    * @memberof cloud-foundry.model.route
    * @description lists all apps for the route and store the response in the model
    * @param {string} guid - route identifier
    * @param {object} params - optional parameters
    * @returns {promise} A resolved/rejected promise
    * @public
    */
    listAllAppsForRoute: function (guid, params) {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.Routes')
        .ListAllAppsForRoute(guid, params)
        .then(function (response) {
          that.route.id = guid;
          that.route.apps = response.data;
        });
    },

   /**
    * @function listAllAppsForRouteWithoutStore
    * @memberof cloud-foundry.model.route
    * @description get all apps for the route
    * @param {string} guid - route identifier
    * @param {object} params - optional parameters
    * @returns {promise} A resolved/rejected promise
    * @public
    */
    listAllAppsForRouteWithoutStore: function (guid, params) {
      return this.apiManager.retrieve('cloud-foundry.api.Routes')
        .ListAllAppsForRoute(guid, params)
        .then(function (response) {
          return response.data.resources;
        });
    }
  });

})();
