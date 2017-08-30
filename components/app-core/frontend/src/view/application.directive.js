(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('application', application);

  /**
   * @namespace app.view.application
   * @memberof app.view
   * @name application
   * @property {app.view.application.ApplicationController} controller - the application controller
   * @property {string} controllerAs - the application controller identifier
   * @property {string} templateUrl - the application template filepath
   * @returns {object} The application directive definition object
   */
  function application() {
    return {
      controller: ApplicationController,
      controllerAs: 'applicationCtrl',
      templateUrl: 'app/view/application.html'
    };
  }

  /**
   * @namespace app.view.application.ApplicationController
   * @memberof app.view.application
   * @name ApplicationController
   * @param {object} $q - Angular $q service
   * @param {app.utils.appEventService} appEventService - the event bus service
   * @param {app.model.modelManager} modelManager - the application model manager
   * @param {app.model.loginManager} loginManager - the login management service
   * @param {app.view.appUpgradeCheck} appUpgradeCheck - the upgrade check service
   * @param {object} appLocalStorage - the Local Storage In Service
   * @param {app.view.consoleSetupCheck} consoleSetupCheck - the Console Setup checkservice
   * @param {object} $timeout - Angular $timeout service
   * @param {$stateParams} $stateParams - Angular ui-router $stateParams service
   * @param {$window} $window - Angular $window service
   * @param {$rootScope} $rootScope - Angular $rootScope service
   * @param {$scope} $scope - Angular $scope service
   * @param {appLoggedInService} appLoggedInService - Logged In Service
   * @property {app.utils.appEventService} appEventService - the event bus service
   * @property {app.model.modelManager} modelManager - the application model manager
   * @property {app.view.appUpgradeCheck} appUpgradeCheck - the upgrade check service
   * @property {$window} $window - Angular $window service
   * @property {boolean} loggedIn - a flag indicating if user logged in
   * @property {boolean} failedLogin - a flag indicating if user login failed due to bad credentials.
   * @property {boolean} serverErrorOnLogin - a flag indicating if user login failed because of a server error.
   * @class
   */
  function ApplicationController($q, appEventService, modelManager, loginManager, appUpgradeCheck, appLocalStorage,
                                 consoleSetupCheck, $timeout, $stateParams, $window, $rootScope, $scope,
                                 appLoggedInService) {

    var vm = this;

    vm.appUpgradeCheck = appUpgradeCheck;
    vm.consoleSetupCheck = consoleSetupCheck;
    vm.loggedIn = false;
    vm.serverFailedToRespond = false;
    vm.showGlobalSpinner = false;
    vm.ready = false;
    vm.failedLogin = false;
    vm.serverErrorOnLogin = false;
    vm.hideNavigation = $stateParams.hideNavigation;
    vm.hideAccount = $stateParams.hideAccount;
    vm.navbarIconsOnly = false;

    vm.login = login;
    vm.logout = logout;
    vm.reload = reload;

    if (loginManager.isEnabled()) {
      $timeout(function () {
        verifySessionOrCheckUpgrade();
      }, 0);
    } else {
      vm.ready = true;
      vm.loggedIn = true;
      vm.failedLogin = false;
      appEventService.$emit(appEventService.events.LOGIN, !!vm.redirectState);
    }

    // Navigation options
    $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams) {  // eslint-disable-line angular/on-watch
      vm.hideNavigation = toParams.hideNavigation;
      vm.hideAccount = toParams.hideAccount;
    });

    // Read back and persist the state of the navigation bar to local storage
    vm.navbarIconsOnly = appLocalStorage.getItem('navbarIconsOnly', 'false') === 'true';
    $scope.$watch(function () {
      return vm.navbarIconsOnly;
    }, function (nv, ov) {
      if (nv !== ov) {
        appLocalStorage.setItem('navbarIconsOnly', nv);
      }
    });

    /**
     * @function verifySession
     * @memberof app.view.application.ApplicationController
     * @description verify session
     * @returns {object} Promise object for session verification
     * @public
     */
    function verifySession() {
      return modelManager.retrieve('app.model.account')
        .verifySession()
        .then(function () {
          onLoggedIn();
        });
    }

    /**
     * @function verifySessionOrCheckUpgrade
     * @memberof app.view.application.ApplicationController
     * @description Verify session or use version endpoint to check if an upgrade is in progress
     * @public
     */
    function verifySessionOrCheckUpgrade() {
      verifySession().catch(function (response) {
        // We only care about 503 - use upgrade service to determine if this is an upgrade
        if (appUpgradeCheck.isUpgrading(response)) {
          // Upgrade service will cause the upgrade page to be displayed to the user
          appUpgradeCheck.responseError(response);
          // Need to pretend that we are logged in to hide the login page and show the upgrade page
          vm.loggedIn = true;
        }

        // Check if console is not setup
        if (consoleSetupCheck.setupRequired(response)) {
          consoleSetupCheck.responseError(response);
          vm.loggedIn = true;
        }
      }).finally(function () {
        vm.ready = true;
      });
    }

    /**
     * @function login
     * @memberof app.view.application.ApplicationController
     * @description Log in to the application
     * @param {string} username - the username
     * @param {string} password - the password
     * @public
     */
    function login(username, password) {
      modelManager.retrieve('app.model.account')
        .login(username, password)
        .then(
          function () {
            onLoggedIn();
          },
          function (response) {
            onLoginFailed(response);
          }
        );
    }

    /**
     * @function onLoggedIn
     * @memberof app.view.application.ApplicationController
     * @description Logged-in event handler
     * @emits LOGIN
     * @private
     */
    function onLoggedIn() {
      vm.loggedIn = true;
      vm.failedLogin = false;
      vm.serverErrorOnLogin = false;
      vm.serverFailedToRespond = false;
      vm.showGlobalSpinner = true;
      vm.redirectState = false;

      // If we have a setup error, then we don't want to continue login to some other page
      // We will redirect to our error page instead
      var continueLogin = true;

      /**
       * Show cluster registration if user is ITOps (hdp3.admin).
       * Otherwise, show service instance registration as a
       * developer if unregistered.
       */
      var account = modelManager.retrieve('app.model.account');

      var serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
      var userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
      /* eslint-disable */
      // TODO: If this fails, we should show a notification message
      /* eslint-enable */
      $q.all([
        serviceInstanceModel.list(),
        modelManager.retrieve('app.model.consoleInfo').getConsoleInfo(),
        userServiceInstanceModel.list()
      ])
        .then(function () {
          var cfOnly = _.filter(serviceInstanceModel.serviceInstances, {cnsi_type: 'cf'}) || [];
          var noEndpoints = cfOnly.length === 0;
          var dashboardRedirect = appLoggedInService.getDashboardRoute();

          if (noEndpoints) {
            // Admin
            if (account.isAdmin()) {
              vm.redirectState = dashboardRedirect;
            }
            if (!vm.redirectState) {
              // No CF instances, so the system is not setup and the user can't fix this
              continueLogin = false;
              appEventService.$emit(appEventService.events.TRANSFER, 'error-page', {error: 'notSetup'});
            }
          } else {
            // Need to get the user's service list to determine if they have any connected
            // Developer - allow user to connect services, if we have some and none are connected
            if (userServiceInstanceModel.getNumValid() === 0) {
              vm.redirectState = dashboardRedirect;
              if (!vm.redirectState) {
                appEventService.$emit(appEventService.events.TRANSFER, 'error-page', {error: 'notConnected'});
                continueLogin = false;
              }
            }
          }
        })
        .finally(function () {
          vm.showGlobalSpinner = false;
          if (continueLogin) {
            // When we notify listeners that login has completed, in some cases we don't want them
            // to redirect to their page - we might want to control that they go to the endpoints dashboard (for example).
            // So, we pass this flag to tell them login happened, but that they should not redirect
            appEventService.$emit(appEventService.events.LOGIN, !!vm.redirectState);
            // We need to do this after the login events are handled, so that ui-router states we might go to are registered
            if (vm.redirectState) {
              appEventService.$emit(appEventService.events.REDIRECT, vm.redirectState);
            }
          }
        });
    }

    /**
     * @function onLoginFailed
     * @memberof app.view.application.ApplicationController
     * @description Login-failure event handler
     * @param {object} response - the HTTP response
     * @emits LOGIN_FAILED
     * @emits HTTP_5XX_ON_LOGIN
     * @private
     */
    function onLoginFailed(response) {
      if (response.status === -1) {
        // handle the case when the server never responds
        appEventService.$emit(appEventService.events.LOGIN_TIMEOUT);
        vm.serverFailedToRespond = true;
        vm.serverErrorOnLogin = false;
        vm.failedLogin = false;
      } else if (response.status >= 500 && response.status < 600) {
        // Check for upgrade - the upgrade handler will show the error - but we need to hide the login panel
        if (appUpgradeCheck.isUpgrading(response) || consoleSetupCheck.setupRequired(response)) {
          vm.loggedIn = true;
          return;
        }

        // handle 5xx errors when attempting to login
        appEventService.$emit(appEventService.events.HTTP_5XX_ON_LOGIN);
        vm.serverFailedToRespond = false;
        vm.serverErrorOnLogin = true;
        vm.failedLogin = false;
      } else {
        // general authentication failed
        appEventService.$emit(appEventService.events.LOGIN_FAILED);
        vm.serverFailedToRespond = false;
        vm.serverErrorOnLogin = false;
        vm.failedLogin = true;
      }
      vm.loggedIn = false;
    }

    /**
     * @function logout
     * @memberof app.view.application.ApplicationController
     * @description Log out of the application
     * @public
     */
    function logout() {
      vm.showGlobalSpinner = true;
      modelManager.retrieve('app.model.account')
        .logout()
        .then(function () {
          onLoggedOut();

          vm.reload();
        });
    }

    /**
     * @function reload
     * @memberof app.view.application.ApplicationController
     * @description Reload the application
     * @public
     */
    function reload() {
      /* eslint-disable no-warning-comments */
      // FIXME: Can we clean the model and all current state instead? (reload the app for now)
      /* eslint-enable no-warning-comments */
      // Hard reload of the app in the browser ensures all state is cleared
      $window.location = '/';
    }

    /**
     * @function onLoggedOut
     * @memberof app.view.application.ApplicationController
     * @description Logged-out event handler
     * @emits LOGOUT
     * @private
     */
    function onLoggedOut() {
      // no point calling these as we are going to reload the app
      //appEventService.$emit(appEventService.events.LOGOUT);
      //vm.loggedIn = false;
    }
  }

})();
