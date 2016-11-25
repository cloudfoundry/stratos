(function () {
  'use strict';

  angular
    .module('app.view.endpoints.dashboard')
    .factory('app.view.endpoints.dashboard.vcsService', vcsServiceFactory);

  vcsServiceFactory.$inject = [
    '$q',
    'app.model.modelManager',
    'app.view.manageVcsTokens'
  ];

  /**
   * @name vcsService
   * @description provide functionality to view and manage VCS endpoints in the endpoints dashboard
   * @param {object} $q - the Angular $q service
   * @param {app.model.modelManager} modelManager - the application model manager
   * @param {object} manageVcsTokens - the manage VCS tokens service
   * @returns {object} the vcs instance service
   */
  function vcsServiceFactory($q, modelManager, manageVcsTokens) {

    var vcsModel = modelManager.retrieve('cloud-foundry.model.vcs');

    var endpointPrefix = 'vcs_';

    return {
      haveInstances: haveInstances,
      updateInstances: updateInstances,
      updateInstancesCache: updateInstancesCache,
      createEndpointEntries: createEndpointEntries,
      clear: clear
    };

    /**
     * @function _updateEndpoints
     * @memberOf app.view.endpoints.dashboard.serviceInstanceService
     * @description are there any cached service instances?
     * @returns {boolean}
     * @public
     */
    function haveInstances() {
      return vcsModel.vcsClients && vcsModel.vcsClients.length > 0;
    }

    /**
     * @function _updateEndpoints
     * @memberOf app.view.endpoints.dashboard.serviceInstanceService
     * @description Refresh the cnsi service instances within the model
     * @returns {object} a promise
     * @public
     */
    function updateInstances() {
      return $q.all([vcsModel.listVcsTokens().then(function () {
        vcsModel.checkTokensValidity();
      }), vcsModel.listVcsClients()]);
    }

    /**
     * @function updateInstancesCache
     * @memberOf app.view.endpoints.dashboard.serviceInstanceService
     * @description repopulate the endpoints list with the latest data from cache
     * @param {Array} endpoints - collection of existing endpoints
     * @public
     */
    function updateInstancesCache(endpoints) {
      // First remove any stale data. Any digests should be unaffected by flip-flopping as this is all sync
      _.remove(endpoints, function (endpoint) {
        return endpoint.key.indexOf(endpointPrefix) === 0;
      });
      createEndpointEntries(endpoints);
    }

    function getStatus(vcsGuid) {
      return function () {

        var filtered = _.filter(vcsModel.vcsTokens, function (token) {
          return token.vcs.guid === vcsGuid;
        });

        if (filtered.length < 1) {
          return 'unconnected';
        }

        var allValid = true;
        var allInvalid = true;
        for (var i = 0; i < filtered.length; i++) {
          var tokenGuid = filtered[i].token.guid;
          allValid = allValid && !!vcsModel.validTokens[tokenGuid];
          allInvalid = allInvalid && !vcsModel.validTokens[tokenGuid];
        }

        if (allValid) {
          return 'connected';
        }
        if (allInvalid) {
          return 'error';
        }
        return 'complicated';
      };
    }

    /**
     * @function createEndpointEntries
     * @memberOf app.view.endpoints.dashboard.serviceInstanceService
     * @description convert the model service instances into endpoints entries
     * @param {Array} endpoints - collection of existing endpoints
     * @returns {Array} latest set of service instance endpoint entries
     * @public
     */
    function createEndpointEntries(endpoints) {
      var activeEndpoints = [];
      // Create or update the generic 'endpoint' object used to populate the dashboard table
      _.forEach(vcsModel.vcsClients, function (vcs) {
        var endpoint = _.find(endpoints, function (e) { return e.guid === vcs.guid; });
        var reuse = !!endpoint;
        if (!reuse) {
          endpoint = {
            key: endpointPrefix + vcs.guid,
            guid: vcs.guid,
            connected: 'unconnected',
            getStatus: getStatus(vcs.guid)
          };
          endpoints.push(endpoint);
        }
        activeEndpoints.push(endpoint.key);

        endpoint.name = vcs.label;
        endpoint.type = gettext(vcs.vcs_type);
        endpoint.url = vcs.browse_url;
        endpoint.actionsTarget = vcs;
        endpoint.actions = _createInstanceActions(endpoints);
      });
      return activeEndpoints;
    }

    /**
     * @function clear
     * @memberOf app.view.endpoints.dashboard.serviceInstanceService
     * @description clear any local data before leaving the dashboard
     * @public
     */
    function clear() {}

    function _createInstanceActions(endpoints) {
      return [{
        name: gettext('Manage'),
        execute: function (vcs) {
          _manage(endpoints, vcs);
        }
      }];
    }

    function _manage(endpoints, vcs) {
      return manageVcsTokens.manage(vcs).then(function () {
        console.log('After manage, TODO: refresh VCS');
      });
    }

  }

})();
