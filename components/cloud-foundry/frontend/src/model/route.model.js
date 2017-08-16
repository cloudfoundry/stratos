(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model
   * @description Route model
   */
  angular
    .module('cloud-foundry.model')
    .run(registerRouteModel);

  function registerRouteModel(modelManager, apiManager, modelUtils) {
    modelManager.register('cloud-foundry.model.route', new Route(apiManager, modelUtils));
  }

  /**
   * @memberof cloud-foundry.model
   * @name Route
   * @param {app.api.apiManager} apiManager - the API manager
   * @param {cloud-foundry.model.modelUtils} modelUtils - a service containing general cf model helpers
   * @property {app.api.apiManager} apiManager - the API manager
   * @property {cloud-foundry.model.modelUtils} modelUtils - service containing general cf model helpers
   * @property {object} route - the currently selected route state
   * @class
   */
  function Route(apiManager, modelUtils) {

    var routesApi = apiManager.retrieve('cloud-foundry.api.Routes');

    var model = {
      route: {},
      checkRouteExists: checkRouteExists,
      associateAppWithRoute: associateAppWithRoute,
      removeAppFromRoute: removeAppFromRoute,
      createRoute: createRoute,
      deleteRoute: deleteRoute,
      listAllAppsForRoute: listAllAppsForRoute,
      listAllAppsForRouteWithoutStore: listAllAppsForRouteWithoutStore,
      listAllRouteMappingsForRoute: listAllRouteMappingsForRoute
    };

    return model;

    /**
     * @function checkRouteExists
     * @memberof cloud-foundry.model.route
     * @description check a route exists
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {string} domainGuid - route's domain identifier
     * @param {string} host - route's host part
     * @param {string} path - route's path part
     * @param {string} port - route's port part
     * @returns {object} A resolved/rejected promise
     * @public
     */
    function checkRouteExists(cnsiGuid, domainGuid, host, path, port) {
      return routesApi
        .CheckRouteExists(domainGuid, host, path || '', port || '', {}, modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data;
        });
    }

    /**
     * @function associateAppWithRoute
     * @memberof cloud-foundry.model.route
     * @description associate app with the route
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {string} guid - route identifier
     * @param {string} appGuid - app identifier
     * @returns {object} A resolved/rejected promise
     * @public
     */
    function associateAppWithRoute(cnsiGuid, guid, appGuid) {
      return routesApi
        .AssociateAppWithRoute(guid, appGuid, {}, modelUtils.makeHttpConfig(cnsiGuid));
    }

    /**
     * @function removeAppFromRoute
     * @memberof cloud-foundry.model.route
     * @description remove app from the route
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {string} guid - route identifier
     * @param {string} appGuid - app identifier
     * @returns {object} A resolved/rejected promise
     * @public
     */
    function removeAppFromRoute(cnsiGuid, guid, appGuid) {
      return routesApi
        .RemoveAppFromRoute(guid, appGuid, {}, modelUtils.makeHttpConfig(cnsiGuid));
    }

    function createRoute(cnsiGuid, routeSpec, params) {
      var routeParams = params || {};
      return routesApi
        .CreateRoute(routeSpec, routeParams, modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data;
        });
    }

    /**
     * @function deleteApp
     * @memberof cloud-foundry.model.route
     * @description deletes a particular route
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {string} guid - route identifier
     * @param {boolean} recursive - flag for recursive delete or not (not currently used by sub-code)
     * @returns {object} A resolved/rejected promise
     * @public
     */
    function deleteRoute(cnsiGuid, guid, recursive) {
      return routesApi
        .DeleteRoute(guid, recursive, {}, modelUtils.makeHttpConfig(cnsiGuid));
    }

    /**
     * @function listAllAppsForRoute
     * @memberof cloud-foundry.model.route
     * @description lists all apps for the route and store the response in the model
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {string} guid - route identifier
     * @param {object=} params - optional parameters
     * @param {boolean=} paginate - true to return the original possibly paginated list, otherwise a de-paginated list
     * containing ALL results will be returned. This could mean more than one http request is made.
     * @returns {object} A resolved/rejected promise
     * @public
     */
    function listAllAppsForRoute(cnsiGuid, guid, params, paginate) {
      return routesApi
        .ListAllAppsForRoute(guid, params, modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (paginate) {
            return response.data;
          }
          return modelUtils.dePaginate(response.data, modelUtils.makeHttpConfig(cnsiGuid))
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
          model.route.id = guid;
          model.route.apps = responseData;
          return responseData;
        });
    }

    /**
     * @function listAllAppsForRouteWithoutStore
     * @memberof cloud-foundry.model.route
     * @description get all apps for the route
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {string} guid - route identifier
     * @param {object} params - optional parameters
     * @param {boolean=} paginate - true to return the original possibly paginated list, otherwise a de-paginated list
     * containing ALL results will be returned. This could mean more than one http request is made.
     * @returns {object} A resolved/rejected promise
     * @public
     */
    function listAllAppsForRouteWithoutStore(cnsiGuid, guid, params, paginate) {
      return routesApi
        .ListAllAppsForRoute(guid, params, modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (paginate) {
            return response.data;
          }
          return modelUtils.dePaginate(response.data, modelUtils.makeHttpConfig(cnsiGuid))
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
    }

    /**
     * @function listAllRouteMappingsForRoute
     * @memberof cloud-foundry.model.route
     * @description get all mappings for this route
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {string} guid - route identifier
     * @param {object=} params - optional parameters
     * @param {boolean=} paginate - true to return the original possibly paginated list, otherwise a de-paginated list
     * containing ALL results will be returned. This could mean more than one http request is made.
     * @returns {object} A resolved/rejected promise
     * @public
     */
    function listAllRouteMappingsForRoute(cnsiGuid, guid, params, paginate) {
      return routesApi
        .ListAllRouteMappingsForRoute(guid, params, modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (!paginate) {
            return modelUtils.dePaginate(response.data, modelUtils.makeHttpConfig(cnsiGuid));
          }
          return response.data.resources;
        });
    }
  }
})();
