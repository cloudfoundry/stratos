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
    'app.view.hceRegistration',
    'app.view.hcfRegistration',
    'app.view.endpoints.dashboard.serviceInstanceService'
  ];

  /**
   * @namespace app.view.endpoints.hce
   * @memberof app.view.endpoints.hce
   * @name EndpointsDashboardController
   * @param {object} $q - the Angular $q service
   * @param {object} $scope - the angular scope service
   * @param {object} $state - the UI router $state service
   * @param {app.model.modelManager} modelManager - the application model manager
   * @param {app.view.hceRegistration} hceRegistration - HCE Registration detail view service
   * @param {app.view.hcfRegistration} hcfRegistration - HCF Registration detail view service
   * @param {app.view.endpoints.dashboard.serviceInstanceService} serviceInstanceService - service to support dashboard with cnsi type endpoints
   * @constructor
   */
  function EndpointsDashboardController($q, $scope, $state, modelManager, hceRegistration, hcfRegistration, serviceInstanceService) {
    var that = this;
    var currentUserAccount = modelManager.retrieve('app.model.account');

    this.initialised = true;
    this.listError = false;
    this.endpoints = [];

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

    _updateEndpoints();

    var temphceRegistration = hceRegistration;
    var temphcfRegistration = hcfRegistration;
    var tempFlip = true;
    this.tempRegister = function () {
      tempFlip = !tempFlip;
      if (tempFlip) {
        temphceRegistration.add()
          .then(function () {
            return _updateEndpoints();
          });
      } else {
        temphcfRegistration.add()
          .then(function () {
            return _updateEndpoints();
          });
      }
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

    function _haveCachedEndpoints() {
      return serviceInstanceService.haveInstances();
    }

    function _updateEndpointsFromCache() {
      that.endpoints.length = 0;
      return $q.all([serviceInstanceService.createEndpointEntries(that.endpoints)]).then(function (results) {

        _.forEach(results, function (result) {
          Array.prototype.push.apply(that.endpoints, result);
        });

        if (!that.initialised) {
          // Show welcome message only if this is the first time around and there no endpoints
          that.showWelcomeMessage = that.endpoints.length === 0;
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
