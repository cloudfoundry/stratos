(function () {
  'use strict';

  angular
    .module('app.view.endpoints.dashboard', [ ])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute ($stateProvider) {
    $stateProvider.state('endpoints.dashboard', {
      url: '',
      templateUrl: 'app/view/endpoints/dashboard/endpoints-dashboard.html',
      controller: EndpointsDashboardController,
      controllerAs: 'endpointsDashboardCtrl'
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
   * @param $q
   * @constructor
   */
  function EndpointsDashboardController (modelManager, $state, hceRegistration, hcfRegistration, $q) {

    this.modelManager = modelManager;
    this.serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
    this.userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
    this.currentUserAccount = modelManager.retrieve('app.model.account');
    this.$state = $state;
    this.hceRegistration = hceRegistration;
    this.hcfRegistration = hcfRegistration;

    this.currentEndpoints = [];
    // Start off with an initial state
    this.serviceInstances = {};
    this.listPromiseResolved = false;
    // Show welcome message only if no endpoints are registered
    this.showWelcomeMessage = this.serviceInstanceModel.serviceInstances.length === 0;
    this.serviceInstanceModel.list();
    this.$q = $q;

    this._updateEndpoints();

  }

  angular.extend(EndpointsDashboardController.prototype, {

    /**
     * @namespace app.view.endpoints.dashboard
     * @memberof app.view.endpoints.dashboard
     * @name showClusterAddForm
     * @description Show cluster add form
     */
    showClusterAddForm: function () {
      var that = this;
      if (this.isHcf()) {
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
    },

    /**
     * @namespace app.view.endpoints.dashboard
     * @memberof app.view.endpoints.dashboard
     * @name isHcf
     * @description Check if endpoint view instance is an HCF instance
     * @return {Boolean}
     */
    isHcf: function () {
      return this.serviceType === 'hcf';
    },

    /**
     * @namespace app.view.endpoints.dashboard
     * @memberof app.view.endpoints.dashboard
     * @name hideWelcomeMessage
     * @description Hide Welcome message
     */
    hideWelcomeMessage: function () {
      this.showWelcomeMessage = false;
    },

    /**
     * @function isUserAdmin
     * @memberOf app.view.endpoints.dashboard
     * @description Is current user an admin?
     * @returns {Boolean}
     */
    isUserAdmin: function () {
      return this.currentUserAccount.isAdmin();
    },

    /**
     * @function _updateEndpoints
     * @memberOf app.view.endpoints.dashboard
     * @description Is current user an admin?
     * @returns {*}
     * @private
     */
    _updateEndpoints: function () {

      var that = this;
      return this.$q.all([this.serviceInstanceModel.list(), this.userServiceInstanceModel.list()])
        .then(function () {
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
        }).then(function(){
          that.listPromiseResolved = true;
        });
    }
  });

})();
