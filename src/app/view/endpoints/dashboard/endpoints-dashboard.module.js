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
    '$scope',
    '$interpolate',
    'app.model.modelManager',
    '$state',
    'app.view.hceRegistration',
    'app.view.hcfRegistration',
    'app.error.errorService',
    '$q'
  ];

  /**
   * @namespace app.view.endpoints.hce
   * @memberof app.view.endpoints.hce
   * @name EndpointsDashboardController
   * @param {object} $scope - the angular scope service
   * @param {object} $interpolate - the angular interpolate service
   * @param {app.model.modelManager} modelManager - the application model manager
   * @param {object} $state - the UI router $state service
   * @param {app.view.hceRegistration} hceRegistration - HCE Registration detail view service
   * @param {app.view.hcfRegistration} hcfRegistration - HCF Registration detail view service
   * @param {app.error.errorService} errorService - service to show custom errors below title bar
   * @param {object} $q - the Angular $q service
   * @constructor
   */
  function EndpointsDashboardController($scope, $interpolate, modelManager, $state, hceRegistration, hcfRegistration, errorService, $q) {
    var that = this;
    this.modelManager = modelManager;
    this.serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
    this.userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
    this.currentUserAccount = modelManager.retrieve('app.model.account');
    this.$state = $state;
    this.hceRegistration = hceRegistration;
    this.hcfRegistration = hcfRegistration;
    this.listPromiseResolved = false;
    this.listError = false;

    this.serviceInstances = {};
    if (this.serviceInstanceModel.serviceInstances > 0) {
      // serviceInstanceModel has previously been updated
      // to decrease load time, we will use that data.
      // we will still refresh the data asyncronously and the UI will update to relect and changes
      this.listPromiseResolved = true;
      _updateLocalServiceInstances();
    }
    // Show welcome message only if no endpoints are registered
    this.showWelcomeMessage = this.serviceInstanceModel.serviceInstances.length === 0;
    this.$q = $q;

    // Ensure any app errors we have set are cleared when the scope is destroyed
    $scope.$on('$destroy', function () {
      errorService.clearAppError();
    });

    _updateEndpoints();

    /**
     * @namespace app.view.endpoints.dashboard
     * @memberof app.view.endpoints.dashboard
     * @name showClusterAddForm
     * @description Show cluster add form
     * @param {boolean} isHcf  when true show cluster add form for HCF
     */
    this.showClusterAddForm = function (isHcf) {
      var that = this;
      if (isHcf) {
        this.hcfRegistration.add()
          .then(function () {
            return that._updateEndpoints;
          });
      } else {
        this.hceRegistration.add()
          .then(function () {
            return that._updateEndpoints;
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
      return that.currentUserAccount.isAdmin();
    };

    /**
     * @function reload
     * @memberOf app.view.endpoints.dashboard
     * @description Reload the curent view (used if there was an error loading the dashboard)
     */
    this.reload = function () {
      $state.reload();
    };

    /**
     * @function _updateLocalServiceInstances
     * @memberOf app.view.endpoints.dashboard
     * @description Updates local service instances
     * @private
     */
    function _updateLocalServiceInstances() {
      if (that.showWelcomeMessage && that.serviceInstanceModel.serviceInstances.length > 0) {
        that.showWelcomeMessage = false;
      }
      _.forEach(that.serviceInstanceModel.serviceInstances, function (serviceInstance) {
        var guid = serviceInstance.guid;
        if (angular.isUndefined(that.serviceInstances[guid])) {
          that.serviceInstances[guid] = serviceInstance;
        } else {
          angular.extend(that.serviceInstances[guid], serviceInstance);
        }
      });
    }

    /**
     * @function _updateEndpoints
     * @memberOf app.view.endpoints.dashboard
     * @description Is current user an admin?
     * @returns {object} a promise
     * @private
     */
    function _updateEndpoints() {
      return that.$q.all([that.serviceInstanceModel.list(), that.userServiceInstanceModel.list()])
        .then(function () {

          var errors = _.filter(that.userServiceInstanceModel.serviceInstances, {error: true});
          errors = _.map(errors, 'name');

          var userServicesCount = Object.keys(that.userServiceInstanceModel.serviceInstances).length;

          // Ensure the wording of any errors do not use 'connect' to avoid misleading 'connected' stats in tiles.
          // (otherwise we need to add additional 'errored' line to tiles)
          if (!userServicesCount || errors.length === 0) {
            // If there are no services or no errors continue as normal
            errorService.clearAppError();
          } else if (errors.length === 1) {
            var errorMessage = gettext('The Console could not contact the endpoint named "{{name}}". Try reconnecting to this endpoint to resolve this problem.');
            errorService.setAppError($interpolate(errorMessage)({name: errors[0]}));
          } else if (errors.length > 1) {
            errorService.setAppError(gettext('The Console could not contact multiple endpoints.'));
          }

        })
        .then(function () {
          that.listError = false;
          _updateLocalServiceInstances();
        })
        .catch(function () {
          that.listError = true;
        })
        .finally(function () {
          that.listPromiseResolved = true;
        });
    }
  }

})();
