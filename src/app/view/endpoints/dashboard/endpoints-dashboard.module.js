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
    'app.model.modelManager',
    '$state',
    'app.view.hceRegistration',
    'app.view.hcfRegistration',
    '$q'
  ];

  /**
   * @namespace app.view.endpoints.hce
   * @memberof app.view.endpoints.hce
   * @name EndpointsDashboardController
   * @param {app.model.modelManager} modelManager - the application model manager
   * @param {object} $state - the UI router $state service
   * @param {app.view.hceRegistration} hceRegistration - HCE Registration detail view service
   * @param {app.view.hcfRegistration} hcfRegistration - HCF Registration detail view service
   * @param {object} $q - the Angular $q service
   * @constructor
   */
  function EndpointsDashboardController(modelManager, $state, hceRegistration, hcfRegistration, $q) {
    var that = this;
    this.modelManager = modelManager;
    this.serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
    this.userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
    this.currentUserAccount = modelManager.retrieve('app.model.account');
    this.$state = $state;
    this.hceRegistration = hceRegistration;
    this.hcfRegistration = hcfRegistration;
    this.listPromiseResolved = false;

    this.serviceInstances = {};
    if (this.serviceInstanceModel.serviceInstances > 0) {
      // serviceInstanceModel has previously been updated
      // to decrease load time, we will use that data.
      this.listPromiseResolved = true;
      _updateLocalServiceInstances();
    }
    // Show welcome message only if no endpoints are registered
    this.showWelcomeMessage = this.serviceInstanceModel.serviceInstances.length === 0;
    this.serviceInstanceModel.list();
    this.$q = $q;

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
     * @returns {*}
     * @private
     */
    function _updateEndpoints() {
      return that.$q.all([that.serviceInstanceModel.list(), that.userServiceInstanceModel.list()])
        .then(function () {
          _updateLocalServiceInstances();
        }).then(function () {
          that.listPromiseResolved = true;
        });
    }
  }

})();
