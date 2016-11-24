(function () {
  'use strict';

  angular
    .module('app.view.endpoints.dashboard', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.dashboard', {
      url: '',
      templateUrl: 'app/view/endpoints/dashboard/endpoints-dashboard.html',
      controller: EndpointsDashboardController,
      controllerAs: 'endpointsDashboardCtrl',
      ncyBreadcrumb: {
        label: gettext('Endpoints')
      }
    });
  }

  EndpointsDashboardController.$inject = [
    '$q',
    '$scope',
    '$state',
    'app.model.modelManager',
    'app.utils.utilsService',
    'app.view.registerService',
    'app.view.endpoints.dashboard.serviceInstanceService'
  ];

  /**
   * @namespace app.view.endpoints.dashboard
   * @memberof app.view.endpoints.dashboard
   * @name EndpointsDashboardController
   * @param {object} $q - the Angular $q service
   * @param {object} $scope - the angular scope service
   * @param {object} $state - the UI router $state service
   * @param {app.model.modelManager} modelManager - the application model manager
   * @param {app.utils.utilsService} utilsService - the utils service
   * @param {app.view.registerService} registerService register service to display the core slide out
   * @param {app.view.endpoints.dashboard.serviceInstanceService} serviceInstanceService - service to support dashboard with cnsi type endpoints
   * @constructor
   */
  function EndpointsDashboardController($q, $scope, $state, modelManager, utilsService, registerService,
                                        serviceInstanceService) {
    var that = this;
    var currentUserAccount = modelManager.retrieve('app.model.account');

    this.initialised = false;
    this.listError = false;

    if (_haveCachedEndpoints()) {
      // serviceInstanceModel has previously been updated
      // to decrease load time, we will use that data.
      // we will still refresh the data asynchronously and the UI will update to reflect changes
      _updateEndpointsFromCache();
    }

    // Ensure any app errors we have set are cleared when the scope is destroyed
    $scope.$on('$destroy', function () {
      serviceInstanceService.clear();
    });

    /**
     * @namespace app.view.endpoints.dashboard
     * @memberof app.view.endpoints.dashboard
     * @name register
     * @description Register a service endpoint
     * @param {string} type - type of endpoint being registered. selects the initial 'type' drop down value
     */
    this.register = function (type) {
      registerService.add($scope, type).then(function () {
        _updateEndpoints();
      });
    };

    /**
     * @namespace app.view.endpoints.dashboard
     * @memberof app.view.endpoints.dashboard
     * @name hideWelcomeMessage
     * @description Hide Welcome message
     */
    this.hideWelcomeMessage = function () {
      this.showWelcomeMessage = false;
    };

    /**
     * @function isUserAdmin
     * @memberOf app.view.endpoints.dashboard
     * @description Is current user an admin?
     * @returns {Boolean}
     */
    this.isUserAdmin = function () {
      return currentUserAccount.isAdmin();
    };

    /**
     * @function reload
     * @memberOf app.view.endpoints.dashboard
     * @description Reload the current view (used if there was an error loading the dashboard)
     */
    this.reload = function () {
      $state.reload();
    };

    function init() {
      _updateEndpoints().then(function () {
        _updateWelcomeMessage();
      });
    }

    utilsService.chainStateResolve('endpoint.dashboard', $state, init);

    function _updateWelcomeMessage() {
      // Show the welcome message if either...
      if (that.isUserAdmin()) {
        // The user is admin and there are no endpoints registered
        that.showWelcomeMessage = that.endpoints.length === 0;
      } else {
        // The user is not admin and there are no connected endpoints (note - they should never reach here if there
        // are no registered endpoints)
        that.showWelcomeMessage = !_.find(that.endpoints, { connected: 'connected' });
      }
    }

    function _haveCachedEndpoints() {
      return serviceInstanceService.haveInstances();
    }

    function _updateEndpointsFromCache() {
      if (that.endpoints) {
        that.endpoints.length = 0;
      } else {
        that.endpoints = [];
      }
      return $q.all([serviceInstanceService.createEndpointEntries(that.endpoints)]).then(function (results) {

        _.forEach(results, function (result) {
          Array.prototype.push.apply(that.endpoints, result);
        });

        if (!that.initialised) {
          // Show welcome message only if this is the first time around and there no endpoints
          _updateWelcomeMessage();
        }

        that.initialised = true;
      });
    }

    /**
     * @function _updateEndpoints
     * @memberOf app.view.endpoints.dashboard
     * @description update the models supporting the endpoints dashboard and refresh the local endpoints list
     * @returns {object} a promise
     * @private
     */
    function _updateEndpoints() {
      return $q.all([serviceInstanceService.updateInstances()])
        .then(function () {
          that.listError = false;
        })
        .catch(function () {
          that.listError = true;
        })
        .then(function () {
          return _updateEndpointsFromCache(that.endpoints);
        })
        .finally(function () {
          that.intialised = true;
        });
    }
  }

})();
