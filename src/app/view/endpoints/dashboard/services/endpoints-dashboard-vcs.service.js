(function () {
  'use strict';

  angular
    .module('app.view.endpoints.dashboard')
    .factory('app.view.endpoints.dashboard.vcsService', vcsServiceFactory);

  vcsServiceFactory.$inject = [
    '$q',
    'app.model.modelManager'
  ];

  /**
   * @namespace app.view.endpoints.dashboard
   * @memberOf app.view.endpoints.dashboard
   * @name serviceInstanceService
   * @description provide functionality to support cnsi service instances (cnsisi..) in the endpoints dashboard
   * @param {object} $q - the Angular $q service
   * @param {app.model.modelManager} modelManager - the application model manager
   * @returns {object} the vcs instance service
   */
  function vcsServiceFactory($q, modelManager) {

    var vcsModel = modelManager.retrieve('cloud-foundry.model.vcs');

    var validTokens = {};
    var validCheckInFlight = false;
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
        _checkTokensValidity();
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

    function _checkTokensValidity() {
      var promises = [];
      validCheckInFlight = true;
      for (var i = 0; i < vcsModel.vcsTokens.length; i++) {
        var vcsToken = vcsModel.vcsTokens[i];
        var check = vcsModel.checkVcsToken(vcsToken.token.guid).then(function (res) {
          if (res.valid === true) {
            validTokens[vcsToken.token.guid] = true;
          } else {
            delete validTokens[vcsToken.token.guid];
          }
        });
        promises.push(check);
      }
      // Cleanup stale tokens
      for (var tokenGuid in validTokens) {
        if (!validTokens.hasOwnProperty(tokenGuid)) { continue; }
        if (!_.find(vcsModel.vcsTokens, function (token) {
            return token.token.guid === tokenGuid;
          })) {
          delete validTokens[tokenGuid];
        }
      }
      return $q.all(promises).finally(function () {
        validCheckInFlight = false;
      });
    }

    function getStatus(vcsGuid) {
      return function () {

        if (validCheckInFlight) {
          return 'unconnected';
        }

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
          allValid = allValid && !!validTokens[tokenGuid];
          allInvalid = allInvalid && !validTokens[tokenGuid];
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
      console.log('TODO: manage VCS: ', vcs);
    }

  }

})();
