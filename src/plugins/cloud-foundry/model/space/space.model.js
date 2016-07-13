(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model
   * @description Space model
   */
  angular
    .module('cloud-foundry.model')
    .run(registerSpaceModel);

  registerSpaceModel.$inject = [
    'app.model.modelManager',
    'app.api.apiManager'
  ];

  function registerSpaceModel(modelManager, apiManager) {
    modelManager.register('cloud-foundry.model.space', new Space(apiManager));
  }

  /**
   * @memberof cloud-foundry.model
   * @name Space
   * @param {app.api.apiManager} apiManager - the API manager
   * @property {app.api.apiManager} apiManager - the API manager
   * @class
   */
  function Space(apiManager) {
    this.apiManager = apiManager;
    this.data = {
    };

    var passThroughHeader = {
      'x-cnap-passthrough': 'true'
    };

    this.makeHttpConfig = function (cnsiGuid) {
      var headers = {'x-cnap-cnsi-list': cnsiGuid};
      angular.extend(headers, passThroughHeader);
      return {
        headers: headers
      };
    };
  }

  angular.extend(Space.prototype, {
   /**
    * @function listAllAppsForSpace
    * @memberof cloud-foundry.model.space
    * @description lists all spaces
    * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
    * @param {string} guid - space GUID.
    * @param {object} params - optional parameters
    * @returns {promise} A resolved/rejected promise
    * @public
    */
    listAllAppsForSpace: function (cnsiGuid, guid, params) {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.Spaces')
        .ListAllAppsForSpace(guid, params, this.makeHttpConfig(cnsiGuid))
        .then(function(response) {
          that.onAllAppsForSpace(cnsiGuid, guid, response.data.resources);
          return response.data.resources;
        });
    },

    onAllAppsForSpace: function(cnsiGuid, spaceGuid, apps) {
      _.set(this.data, cnsiGuid + '.apps.' + spaceGuid, apps);
    },

   /**
    * @function listAllSpaces
    * @memberof cloud-foundry.model.space
    * @description lists all spaces
    * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
    * @param {object} params - optional parameters
    * @returns {promise} A resolved/rejected promise
    * @public
    */
    listAllSpaces: function (cnsiGuid, params) {
     var that = this;
     return this.apiManager.retrieve('cloud-foundry.api.Spaces')
       .ListAllSpaces(params, this.makeHttpConfig(cnsiGuid))
       .then(function(response) {
         that.onAllSpaces(cnsiGuid, response.data.resources);
         return response.data.resources;
       });
    },

    onAllSpaces: function(cnsiGuid, spaces) {
      var that = this;
      _.unset(this.data, cnsiGuid + '.spaces');
      _.forEach(spaces, function(space) {
        var dataPath = cnsiGuid + '.spaces.' + space.entity.organization_guid;
        var orgSpaces = _.get(that.data, dataPath, {});
        orgSpaces[space.metadata.guid] = space;
        _.set(that.data, dataPath, orgSpaces);
      });
    },

    /**
     * @function listAllServicesForSpace
     * @memberof cloud-foundry.model.space
     * @description List all services available for space
     * @param {string} cnsiGuid - the CNSI guid
     * @param {string} guid - the space guid
     * @param {object} params - extra params to pass to request
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    listAllServicesForSpace: function (cnsiGuid, guid, params) {
      return this.apiManager.retrieve('cloud-foundry.api.Spaces')
        .ListAllServicesForSpace(guid, params, this.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data.resources;
        });
    },

    /**
     * @function listAllServiceInstancesForSpace
     * @memberof cloud-foundry.model.space
     * @description List all service instances available for space
     * @param {string} cnsiGuid - the CNSI guid
     * @param {string} guid - the space guid
     * @param {object} params - extra params to pass to request
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    listAllServiceInstancesForSpace: function (cnsiGuid, guid, params) {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.Spaces')
        .ListAllServiceInstancesForSpace(guid, params, this.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          that.onAllServiceInstancesForSpace(cnsiGuid, guid, response.data.resources);
          return response.data.resources;
        });
    },

    /**
     * @function listAllRoutesForSpace
     * @memberof cloud-foundry.model.space
     * @description Lost all routes for service
     * @param {string} cnsiGuid - the CNSI guid
     * @param {string} guid - the space guid
     * @param {object} options - additional parameters for request
     * @returns {promise} A promise object
     * @public
     */
    listAllRoutesForSpace: function (cnsiGuid, guid, options) {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.Spaces')
        .ListAllRoutesForSpace(guid, options, this.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return that.onListAllRoutesForSpace(cnsiGuid, guid, response.data.resources);
        });
    },

    onAllServiceInstancesForSpace: function(cnsiGuid, spaceGuid, instances) {
      _.set(this.data, cnsiGuid + '.serviceInstances.' + spaceGuid, instances);
    },

    /**
     * @function onListAllRoutesForSpace
     * @memberof cloud-foundry.model.space
     * @description listAllRoutesForSpace handler at model layer
     * @param {string} cnsiGuid - the CNSI guid
     * @param {string} spaceGuid - the space guid
     * @param {string} routes - the JSON returned from API call
     * @returns {object} The response
     * @private
     */
    onListAllRoutesForSpace: function (cnsiGuid, spaceGuid, routes) {
      _.set(this, 'routes.' + cnsiGuid + '.' + spaceGuid, routes);
      return routes;
    }
  });

})();
