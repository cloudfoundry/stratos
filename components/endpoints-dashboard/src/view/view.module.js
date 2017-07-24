(function () {
  'use strict';

  angular
    .module('endpoints-dashboard')
    .config(registerRoute);

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.dashboard', {
      url: '',
      templateUrl: 'plugins/endpoints-dashboard/view/view.html',
      controller: EndpointsDashboardController,
      controllerAs: 'endpointsDashboardCtrl',
      ncyBreadcrumb: {
        label: 'endpoints',
        translate: true
      }
    });
  }

  /**
   * @namespace app.view.endpoints.dashboard
   * @memberof app.view.endpoints.dashboard
   * @name EndpointsDashboardController
   * @param {object} $scope - the angular scope service
   * @param {object} $state - the UI router $state service
   * @param {app.model.modelManager} modelManager - the application model manager
   * @param {app.utils.appUtilsService} appUtilsService - the appUtilsService service
   * @param {app.view.appRegisterService} appRegisterService register service to display the core slide out
   * @param {app.view.endpoints.dashboard.appEndpointsDashboardService} appEndpointsDashboardService - service to support endpoints dashboard
   * @constructor
   */
  function EndpointsDashboardController($scope, $state, modelManager, appUtilsService, appRegisterService,
                                        appEndpointsDashboardService) {
    var vm = this;

    var currentUserAccount = modelManager.retrieve('app.model.account');

    vm.endpoints = undefined;
    vm.initialised = false;
    vm.register = register;
    vm.hideWelcomeMessage = hideWelcomeMessage;
    vm.isUserAdmin = isUserAdmin;
    vm.reload = reload;
    vm.headerActions = [
      {
        id: 'endpoints-dashboard.register-button',
        name: 'endpoints-dashboard.register-button',
        execute: register,
        hidden: function () {
          return !isUserAdmin();
        },
        disabled: vm.initialised,
        icon: 'add_circle'
      }
    ];

    appEndpointsDashboardService.refreshFromCache();
    if (appEndpointsDashboardService.endpoints.length !== 0) {
      // Avoid flashing up 'no endpoints' ui before we've had a change to update from server in init()
      vm.endpoints = appEndpointsDashboardService.endpoints;
      vm.initialised = true;
      _updateWelcomeMessage();
    }

    appUtilsService.chainStateResolve('endpoint.dashboard', $state, init);

    // Ensure any app errors we have set are cleared when the scope is destroyed
    $scope.$on('$destroy', function () {
      appEndpointsDashboardService.clear();
    });

    /**
     * @namespace app.view.endpoints.dashboard
     * @memberof app.view.endpoints.dashboard
     * @name register
     * @description Register a service endpoint
     */
    function register() {
      appRegisterService.show($scope)
        .then(function () {
          return appEndpointsDashboardService.update();
        })
        .then(function () {
          _updateWelcomeMessage();
        });
    }

    /**
     * @namespace app.view.endpoints.dashboard
     * @memberof app.view.endpoints.dashboard
     * @name hideWelcomeMessage
     * @description Hide Welcome message
     */
    function hideWelcomeMessage() {
      vm.showWelcomeMessage = false;
    }

    /**
     * @function isUserAdmin
     * @memberOf app.view.endpoints.dashboard
     * @description Is current user an admin?
     * @returns {Boolean}
     */
    function isUserAdmin() {
      return currentUserAccount.isAdmin();
    }

    /**
     * @function reload
     * @memberOf app.view.endpoints.dashboard
     * @description Reload the current view (used if there was an error loading the dashboard)
     */
    function reload() {
      $state.reload();
    }

    function init() {
      vm.initialised = false;
      return appEndpointsDashboardService.update()
        .then(function () {
          vm.listError = false;
          vm.initialised = true;
          if (!vm.endpoints) {
            vm.endpoints = appEndpointsDashboardService.endpoints;
          }
          _updateWelcomeMessage();
        }).catch(function () {
          vm.listError = true;
        });
    }

    function _updateWelcomeMessage() {
      // Show the welcome message if either...
      if (vm.isUserAdmin()) {
        // The user is admin and there are no endpoints registered
        vm.showWelcomeMessage = vm.endpoints.length === 0;
      } else {
        // The user is not admin and there are no connected endpoints (note - they should never reach here if there
        // are no registered endpoints)
        vm.showWelcomeMessage = !_.find(vm.endpoints, {connected: 'connected'});
      }
    }
  }

})();
