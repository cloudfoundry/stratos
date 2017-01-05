(function () {
  'use strict';

  angular
    .module('app.view.endpoints.dashboard')
    .factory('app.view.endpoints.dashboard.vcsService', vcsServiceFactory);

  vcsServiceFactory.$inject = [
    '$q',
    '$rootScope',
    '$interpolate',
    'app.model.modelManager',
    'app.view.endpoints.dashboard.dashboardService',
    'app.view.vcs.manageVcsTokens',
    'app.view.vcs.registerVcsToken',
    'app.view.notificationsService',
    'helion.framework.widgets.dialog.confirm'
  ];

  /**
   * @name vcsService
   * @description provide functionality to view and manage VCS endpoints in the endpoints dashboard
   * @param {object} $q - the Angular $q service
   * @param {object} $rootScope - the angular $rootScope service
   * @param {object} $interpolate - the angular $interpolate service
   * @param {app.model.modelManager} modelManager - the application model manager
   * @param {app.view.endpoints.dashboard.dashboardService} dashboardService - service to support endpoints dashboard
   * @param {object} manageVcsTokens - the manage VCS tokens service
   * @param {object} registerVcsToken - register a new VCS token
   * @param {app.view.notificationsService} notificationsService - the toast notification service
   * @param {helion.framework.widgets.dialog.confirm} confirmDialog - the confirmation dialog service
   * @returns {object} the vcs instance service
   */
  function vcsServiceFactory($q, $rootScope, $interpolate, modelManager, dashboardService, manageVcsTokens, registerVcsToken, notificationsService, confirmDialog) {

    var vcsModel = modelManager.retrieve('cloud-foundry.model.vcs');

    var endpointPrefix = 'vcs_';

    return {
      haveInstances: haveInstances,
      updateInstances: updateInstances,
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
     * @description Refresh the VCS and token instances within the model
     * @returns {object} a promise
     * @public
     */
    function updateInstances() {
      return $q.all([_refreshTokens(), vcsModel.listVcsClients()]);
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
     * @public
     */
    function createEndpointEntries() {
      var endpoints = dashboardService.endpoints;
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

      _cleanupStaleEndpoints(activeEndpointsKeys);
    }

    function _cleanupStaleEndpoints(activeEndpointsKeys) {

      var allEndpoints = dashboardService.endpoints;

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
      var currentUserAccount = modelManager.retrieve('app.model.account');
      if (currentUserAccount.isAdmin() && !dashboardService.isCodeEngineVcs(endpoint)) {
        endpoint.actions.push({
          name: gettext('Unregister'),
          execute: function (endpoint) {
            _unregister(endpoint);
          }
        });
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

    function _unregister(endpoint) {
      var scope = $rootScope.$new();
      scope.name = endpoint.name;
      confirmDialog({
        title: gettext('Unregister Endpoint'),
        description: $interpolate(gettext('Please ensure that you have removed this VCS from ' +
          '{{ OEM_CONFIG.CODE_ENGINE }} before proceeding. <br><br>' +
          'Are you sure you want to unregister VCS endpoint \'{{name}}\'?'
          ))(scope),
        errorMessage: gettext('Failed to unregister VCS endpoint'),
        submitCommit: true,
        noHtmlEscape: true,
        windowClass: 'unregister-vcs-dialog',
        buttonText: {
          yes: gettext('Unregister'),
          no: gettext('Cancel')
        },
        callback: function () {
          vcsModel.unregisterVcs(endpoint.vcs.guid).then(function () {
            notificationsService.notify('success', gettext('Successfully unregistered VCS endpoint \'{{name}}\''), {
              name: endpoint.vcs.label
            });
            updateInstances().then(function () {
              createEndpointEntries();
            });
          });
        }
      });
    }

  }

})();
