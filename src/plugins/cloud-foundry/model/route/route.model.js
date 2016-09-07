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
    'app.api.apiManager',
    'cloud-foundry.model.modelUtils'
  ];

  function registerRouteModel(modelManager, apiManager, modelUtils) {
    modelManager.register('cloud-foundry.model.route', new Route(apiManager, modelManager, modelUtils));
  }

  /**
   * @memberof cloud-foundry.model
   * @name Route
   * @param {app.api.apiManager} apiManager - the API manager
   * @param {app.api.modelManager}  modelManager - the Model management service
   * @param {cloud-foundry.model.modelUtils} modelUtils - a service containing general hcf model helpers
   * @property {app.api.apiManager} apiManager - the API manager
   * @property {app.api.modelManager} modelManager - the Model management service
   * @property {cloud-foundry.model.modelUtils} modelUtils - service containing general hcf model helpers
   * @property {object} route - the currently selected route state
   * @class
   */
  function Route(apiManager, modelManager, modelUtils) {
    this.apiManager = apiManager;
    this.modelManager = modelManager;
    this.modelUtils = modelUtils;
    this.route = {};
  }

  angular.extend(Route.prototype, {
   /**
    * @function checkRouteExists
    * @memberof cloud-foundry.model.route
    * @description check a route exists
    * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
    * @param {string} domainGuid - route's domain identifier
    * @param {string} host - route's host part
    * @param {string} path - route's path part
    * @param {string} port - route's port part
    * @returns {promise} A resolved/rejected promise
    * @public
    */
    checkRouteExists: function (cnsiGuid, domainGuid, host, path, port) {
      var httpConfig = {
        headers: { 'x-cnap-cnsi-list': cnsiGuid }
      };
      return this.apiManager.retrieve('cloud-foundry.api.Routes')
        .CheckRouteExists(domainGuid, host, path || '', port || '', {}, httpConfig)
        .then(function (response) {
          return response.data[cnsiGuid];
        });
    },

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
      return this.apiManager.retrieve('cloud-foundry.api.Routes')
        .RemoveAppFromRoute(guid, appGuid, {}, this.modelUtils.makeHttpConfig(cnsiGuid));
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
      return this.apiManager.retrieve('cloud-foundry.api.Routes')
        .DeleteRoute(guid, recursive, {}, this.modelUtils.makeHttpConfig(cnsiGuid));
    },

   /**
    * @function listAllAppsForRoute
    * @memberof cloud-foundry.model.route
    * @description lists all apps for the route and store the response in the model
    * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
    * @param {string} guid - route identifier
    * @param {object=} params - optional parameters
    * @returns {promise} A resolved/rejected promise
    * @public
    */
    listAllAppsForRoute: function (cnsiGuid, guid, params) {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.Routes')
        .ListAllAppsForRoute(guid, params, this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          that.route.id = guid;
          that.route.apps = response.data;
          return response.data;
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
      return this.apiManager.retrieve('cloud-foundry.api.Routes')
        .ListAllAppsForRoute(guid, params, this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data;
        });
    },

    /**
     * @function listAllRouteMappingsForRoute
     * @memberof cloud-foundry.model.route
     * @description get all mappings for this route
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {string} guid - route identifier
     * @param {object=} params - optional parameters
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    listAllRouteMappingsForRoute: function (cnsiGuid, guid, params) {
      return this.apiManager.retrieve('cloud-foundry.api.Routes')
        .ListAllRouteMappingsForRoute(guid, params, this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data.resources;
        });
    },

   /**
    * @function listAllRoutes
    * @memberof cloud-foundry.model.route
    * @description get all route
    * @param {object} params - optional parameters
    * @returns {promise} A resolved/rejected promise
    * @public
    */
    listAllRoutes: function (params) {
      var cnsis = _.chain(this.modelManager.retrieve('app.model.serviceInstance.user').serviceInstances)
                   .values()
                   .map('guid')
                   .value();
      var httpConfig = {
        headers: { 'x-cnap-cnsi-list': cnsis.join(',') }
      };
      return this.apiManager.retrieve('cloud-foundry.api.Routes')
        .ListAllRoutes(params, httpConfig)
        .then(function (response) {
          return response.data;
        });
    }
  });

})();
