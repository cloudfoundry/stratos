(function () {
  'use strict';

  angular
    .module('app.view.endpoints.dashboard', [])
    .config(registerRoute);

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.dashboard', {
      url: '',
      templateUrl: 'app/view/endpoints/dashboard/endpoints-dashboard.html',
      controller: EndpointsDashboardController,
      controllerAs: 'endpointsDashboardCtrl',
      ncyBreadcrumb: {
        label: 'endpoints'
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
   * @param {app.view.endpoints.dashboard.appEndpointsCnsiService} appEndpointsCnsiService - service to support dashboard with cnsi type endpoints
   * @param {app.view.endpoints.dashboard.appEndpointsVcsService} appEndpointsVcsService - service to support dashboard with vcs type endpoints
   * @constructor
   */
  function EndpointsDashboardController($scope, $state, modelManager, appUtilsService, appRegisterService,
                                        appEndpointsDashboardService, appEndpointsCnsiService, appEndpointsVcsService) {
    var vm = this;

    appEndpointsDashboardService.endpointsProviders.push(appEndpointsCnsiService);
    appEndpointsDashboardService.endpointsProviders.push(appEndpointsVcsService);

    var currentUserAccount = modelManager.retrieve('app.model.account');

    vm.endpoints = appEndpointsDashboardService.endpoints;
    vm.initialised = false;
    vm.listError = false;
    vm.register = register;
    vm.hideWelcomeMessage = hideWelcomeMessage;
    vm.isUserAdmin = isUserAdmin;
    vm.reload = reload;

    appEndpointsDashboardService.refresh().then(function () {
      _updateWelcomeMessage();
      vm.initialised = true;
    });

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
        }).then(function () {
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
      return appEndpointsDashboardService.update().then(function () {
        vm.listError = false;
        vm.intialised = true;
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
