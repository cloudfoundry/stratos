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
   * @namespace cloud-foundry.model.route
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
    * @function deleteApp
    * @memberof cloud-foundry.model.route
    * @description Deletes a particular route
    * @param {string} guid - Route identifier
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
    * @description Lists all apps for the route
    * @param {string} guid - Route identifier
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
    }
  });

})();
