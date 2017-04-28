(function () {
  'use strict';

  var PAT_DELIMITER = ';PAT:';

  angular
    .module('code-engine.service')
    .constant('PAT_DELIMITER', PAT_DELIMITER)
    .factory('ceVCSEndpointService', vcsServiceFactory);

  /**
   * @name ceVCSEndpointService
   * @description provide functionality to view and manage VCS endpoints in the endpoints dashboard
   * @param {object} $q - the Angular $q service
   * @param {object} $rootScope - the angular $rootScope service
   * @param {object} $interpolate - the angular $interpolate service
   * @param {app.model.modelManager} modelManager - the application model manager
   * @param {appEndpointsDashboardService} appEndpointsDashboardService - service to support endpoints dashboard
   * @param {ceManageVcsTokens} ceManageVcsTokens - the manage VCS tokens service
   * @param {ceRegisterVcsToken} ceRegisterVcsToken - register a new VCS token
   * @param {appNotificationsService} appNotificationsService - the toast notification service
   * @param {frameworkDialogConfirm} frameworkDialogConfirm - the confirmation dialog service
   * @returns {object} the vcs instance service
   */
  function vcsServiceFactory($q, $rootScope, $interpolate, modelManager, appEndpointsDashboardService,
                             ceManageVcsTokens, ceRegisterVcsToken, appNotificationsService, frameworkDialogConfirm) {

    var endpointPrefix = 'vcs_';
    var codeEngineVcs = [];
    var fetchedCodeEngineVcses = false;
    var service = {
      haveInstances: haveInstances,
      updateInstances: updateInstances,
      createEndpointEntries: createEndpointEntries,
      clear: clear,
      fetchedCodeEngineVcses: false,
      refreshCodeEngineVcses: refreshCodeEngineVcses,
      isCodeEngineVcs: isCodeEngineVcs
    };

    appEndpointsDashboardService.endpointsProviders.push(service);

    return service;

    /**
     * @function haveInstances
     * @memberOf code-engine.service.ceVCSEndpointService
     * @description Synchronous. Are there any cached vcs instances?
     * @returns {boolean}
     * @public
     */
    function haveInstances() {
      var vcsModel = modelManager.retrieve('code-engine.model.vcs');
      return vcsModel.vcsClients && vcsModel.vcsClients.length > 0;
    }

    /**
     * @function updateInstances
     * @memberOf code-engine.service.ceVCSEndpointService
     * @description Refresh the VCS and token instances within the model
     * @returns {object} a promise
     * @public
     */
    function updateInstances() {
      var vcsModel = modelManager.retrieve('code-engine.model.vcs');
      return $q.all([_refreshTokens(), vcsModel.listVcsClients()]).then(function () {
        // Note - We may need to wait for service instances to also have been updated before calling this
        refreshCodeEngineVcses();
      });
    }

    function getStatus(vcs) {
      return function () {
        var vcsModel = modelManager.retrieve('code-engine.model.vcs');
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
     * @memberOf code-engine.service.ceVCSEndpointService
     * @description convert the model service instances into endpoints entries
     * @public
     */
    function createEndpointEntries() {
      var vcsModel = modelManager.retrieve('code-engine.model.vcs');
      var endpoints = appEndpointsDashboardService.endpoints;
      var activeEndpointsKeys = [];
      // Create or update the generic 'endpoint' object used to populate the dashboard table
      _.forEach(vcsModel.vcsClients, function (vcs) {
        var endpoint = _.find(endpoints, function (e) {
          return e.guid === vcs.guid;
        });
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

      var allEndpoints = appEndpointsDashboardService.endpoints;

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
     * @memberOf code-engine.service.ceVCSEndpointService
     * @description Synchronous. clear local data
     * @public
     */
    function clear() {
      fetchedCodeEngineVcses = false;
      codeEngineVcs.length = 0;
    }

    function refreshCodeEngineVcses() {
      var promises = [];
      var hceModel = modelManager.retrieve('code-engine.model.hce');

      var userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
      _.forEach(userServiceInstanceModel.serviceInstances, function (ep) {
        if (ep.cnsi_type === 'hce' && ep.valid) {
          promises.push(hceModel.getVcses(ep.guid));
        }
      });

      return $q.all(promises).then(function (allCeVcses) {
        codeEngineVcs.length = 0;
        for (var i = 0; i < allCeVcses.length; i++) {
          var vcses = allCeVcses[i];
          Array.prototype.push.apply(codeEngineVcs, vcses);
        }
        fetchedCodeEngineVcses = true;
      });

    }

    function isCodeEngineVcs(ep) {
      return !!_.find(codeEngineVcs, function (vcs) {
        return vcs.browse_url === ep.vcs.browse_url && vcs.api_url === ep.vcs.api_url && vcs.label === ep.vcs.label;
      });
    }

    function _createVcsActions(endpoint) {
      var vcsModel = modelManager.retrieve('code-engine.model.vcs');
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
      var userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');

      var noHces = !_.find(userServiceInstanceModel.serviceInstances, {cnsi_type: 'hce', valid: true});
      if (currentUserAccount.isAdmin() && (noHces || fetchedCodeEngineVcses &&
        !isCodeEngineVcs(endpoint))) {
        endpoint.actions.push({
          name: gettext('Unregister'),
          execute: function (endpoint) {
            _unregister(endpoint);
          }
        });
      }
    }

    function _refreshTokens() {
      var vcsModel = modelManager.retrieve('code-engine.model.vcs');
      return vcsModel.listVcsTokens().then(function () {
        // No need to return this promise, validity data is updated asynchronously
        vcsModel.checkTokensValidity();
      });
    }

    function _manageTokens(endpoint) {
      return ceManageVcsTokens.manage(endpoint.vcs).then(function () {
        _createVcsActions(endpoint);
      });
    }

    function _addToken(endpoint) {
      return ceRegisterVcsToken.registerToken(endpoint.vcs).then(function () {
        return _refreshTokens().then(function () {
          _createVcsActions(endpoint);
        });
      });
    }

    function _unregister(endpoint) {
      var vcsModel = modelManager.retrieve('code-engine.model.vcs');
      var scope = $rootScope.$new();
      scope.name = endpoint.name;
      frameworkDialogConfirm({
        title: gettext('Unregister VCS'),
        description: $interpolate(gettext('Please ensure that you have removed VCS <span class="font-semi-bold">{{name}}</span> from ' +
          'Code Engine before proceeding. <br><br>' +
          'All tokens associated with this VCS will also be deleted.'
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
          return vcsModel.unregisterVcs(endpoint.vcs.guid).then(function () {
            appNotificationsService.notify('success', gettext('Successfully unregistered VCS endpoint \'{{name}}\''), {
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
