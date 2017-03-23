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
    'modelManager',
    'apiManager',
    'modelUtils'
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
      return this.apiManager.retrieve('cloud-foundry.api.Routes')
        .CheckRouteExists(domainGuid, host, path || '', port || '', {}, this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data;
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
      return this.apiManager.retrieve('cloud-foundry.api.Routes')
        .AssociateAppWithRoute(guid, appGuid, {}, this.modelUtils.makeHttpConfig(cnsiGuid));
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

    createRoute: function (cnsiGuid, routeSpec, params) {
      var routeParams = params || {};
      return this.apiManager.retrieve('cloud-foundry.api.Routes')
        .CreateRoute(routeSpec, routeParams, this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data;
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
    * @param {boolean=} paginate - true to return the original possibly paginated list, otherwise a de-paginated list
    * containing ALL results will be returned. This could mean more than one http request is made.
    * @returns {promise} A resolved/rejected promise
    * @public
    */
    listAllAppsForRoute: function (cnsiGuid, guid, params, paginate) {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.Routes')
        .ListAllAppsForRoute(guid, params, this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (paginate) {
            return response.data;
          }
          return that.modelUtils.dePaginate(response.data, that.modelUtils.makeHttpConfig(cnsiGuid))
            .then(function (list) {
              return {
                total_pages: 1,
                total_results: list.length,
                prev_url: null,
                next_url: null,
                resources: list
              };
            });
        })
        .then(function (responseData) {
          that.route.id = guid;
          that.route.apps = responseData;
          return responseData;
        });
    },

   /**
    * @function listAllAppsForRouteWithoutStore
    * @memberof cloud-foundry.model.route
    * @description get all apps for the route
    * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
    * @param {string} guid - route identifier
    * @param {object} params - optional parameters
    * @param {boolean=} paginate - true to return the original possibly paginated list, otherwise a de-paginated list
    * containing ALL results will be returned. This could mean more than one http request is made.
    * @returns {promise} A resolved/rejected promise
    * @public
    */
    listAllAppsForRouteWithoutStore: function (cnsiGuid, guid, params, paginate) {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.Routes')
        .ListAllAppsForRoute(guid, params, this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (paginate) {
            return response.data;
          }
          return that.modelUtils.dePaginate(response.data, that.modelUtils.makeHttpConfig(cnsiGuid))
            .then(function (list) {
              return {
                total_pages: 1,
                total_results: list.length,
                prev_url: null,
                next_url: null,
                resources: list
              };
            });
        });
    },

    /**
     * @function listAllRouteMappingsForRoute
     * @memberof cloud-foundry.model.route
     * @description get all mappings for this route
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {string} guid - route identifier
     * @param {object=} params - optional parameters
     * @param {boolean=} paginate - true to return the original possibly paginated list, otherwise a de-paginated list
     * containing ALL results will be returned. This could mean more than one http request is made.
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    listAllRouteMappingsForRoute: function (cnsiGuid, guid, params, paginate) {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.Routes')
        .ListAllRouteMappingsForRoute(guid, params, this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (!paginate) {
            return that.modelUtils.dePaginate(response.data, that.modelUtils.makeHttpConfig(cnsiGuid));
          }
          return response.data.resources;
        });
    }

  });

})();
