(function () {
  'use strict';

  angular
    .module('app.view.endpoints.dashboard')
    .factory('app.view.endpoints.dashboard.vcsService', vcsServiceFactory);

  vcsServiceFactory.$inject = [
    '$q',
    'app.model.modelManager',
    'app.view.vcs.manageVcsTokens',
    'app.view.vcs.registerVcsToken'
  ];

  /**
   * @name vcsService
   * @description provide functionality to view and manage VCS endpoints in the endpoints dashboard
   * @param {object} $q - the Angular $q service
   * @param {app.model.modelManager} modelManager - the application model manager
   * @param {object} manageVcsTokens - the manage VCS tokens service
   * @param {object} registerVcsToken - register a new VCS token
   * @returns {object} the vcs instance service
   */
  function vcsServiceFactory($q, modelManager, manageVcsTokens, registerVcsToken) {

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
     * @memberOf app.view.endpoints.dashboard.cnsiService
     * @description are there any cached service instances?
     * @returns {boolean}
     * @public
     */
    function haveInstances() {
      return vcsModel.vcsClients && vcsModel.vcsClients.length > 0;
    }

    /**
     * @function _updateEndpoints
     * @memberOf app.view.endpoints.dashboard.cnsiService
     * @description Refresh the cnsi service instances within the model
     * @returns {object} a promise
     * @public
     */
    function updateInstances() {
      return $q.all([_refreshTokens(), vcsModel.listVcsClients()]);
    }

    /**
     * @function updateInstancesCache
     * @memberOf app.view.endpoints.dashboard.cnsiService
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

    function getStatus(vcs) {
      return function () {

        var vcsTokens = vcsModel.getTokensForVcs(vcs);

        if (vcsTokens.length < 1) {
          return 'unconnected';
        }

        var allValid = true;
        var allInvalid = true;
        var anyUnknown = false;
        for (var i = 0; i < vcsTokens.length; i++) {
          var tokenGuid = vcsTokens[i].token.guid;
          allValid = allValid && vcsModel.invalidTokens[tokenGuid] === false;
          allInvalid = allInvalid && !!vcsModel.invalidTokens[tokenGuid];
          anyUnknown = anyUnknown || angular.isUndefined(vcsModel.invalidTokens[tokenGuid]);
        }

        // Show disconnected until the check comes back
        if (anyUnknown) {
          return 'unconnected';
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
     * @memberOf app.view.endpoints.dashboard.cnsiService
     * @description convert the model service instances into endpoints entries
     * @param {Array} endpoints - collection of existing endpoints
     * @public
     */
    function createEndpointEntries(endpoints) {
      var activeEndpointsKeys = [];
      // Create or update the generic 'endpoint' object used to populate the dashboard table
      _.forEach(vcsModel.vcsClients, function (vcs) {
        var endpoint = _.find(endpoints, function (e) { return e.guid === vcs.guid; });
        var reuse = !!endpoint;
        if (!reuse) {
          endpoint = {
            key: endpointPrefix + vcs.guid,
            guid: vcs.guid,
            connected: 'unconnected',
            getStatus: getStatus(vcs)
          };
          endpoints.push(endpoint);
        }
        activeEndpointsKeys.push(endpoint.key);

        endpoint.name = vcs.label;
        endpoint.type = gettext(vcsModel.getTypeLabel(vcs));
        endpoint.url = vcs.browse_url;
        endpoint.actionsTarget = endpoint;
        endpoint.vcs = vcs;
        _createVcsActions(endpoint);
      });

      _cleanupStaleEndpoints(endpoints, activeEndpointsKeys);
    }

    function _cleanupStaleEndpoints(allEndpoints, activeEndpointsKeys) {

      var myEndpoints = _.filter(allEndpoints, function (anEndpoint) {
        return anEndpoint.key.indexOf(endpointPrefix) === 0;
      });

      var staleEndpointsKeys = _.differenceWith(myEndpoints, activeEndpointsKeys, function (anEndpoint, aKey) {
        return anEndpoint.key === aKey;
      }).map(function (anEndpoint) {
        return anEndpoint.key;
      });

      for (var i = allEndpoints.length - 1; i >= 0; i--) {
        var endpoint = allEndpoints[i];
        if (staleEndpointsKeys.indexOf(endpoint.key) > -1) {
          allEndpoints.splice(i, 1);
        }
      }
    }

    /**
     * @function clear
     * @memberOf app.view.endpoints.dashboard.cnsiService
     * @description clear any local data before leaving the dashboard
     * @public
     */
    function clear() {}

    function _createVcsActions(endpoint) {
      if (vcsModel.getTokensForVcs(endpoint.vcs).length > 0) {
        endpoint.actions = [{
          name: gettext('Manage Tokens'),
          execute: function (endpoint) {
            _manageTokens(endpoint);
          }
        }];
      } else {
        endpoint.actions = [{
          name: gettext('Add Token'),
          execute: function (endpoint) {
            _addToken(endpoint);
          }
        }];
      }
    }

    function _refreshTokens() {
      return vcsModel.listVcsTokens().then(function () {
        // No need to return this promise, validity data is updated asynchronously
        vcsModel.checkTokensValidity();
      });
    }

    function _manageTokens(endpoint) {
      return manageVcsTokens.manage(endpoint.vcs).then(function () {
        _createVcsActions(endpoint);
      });
    }

    function _addToken(endpoint) {
      return registerVcsToken.registerToken(endpoint.vcs).then(function () {
        return _refreshTokens().then(function () {
          _createVcsActions(endpoint);
        });
      });
    }

  }

})();
