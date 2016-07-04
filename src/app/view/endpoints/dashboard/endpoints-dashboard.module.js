(function () {
  'use strict';

  angular
    .module('app.view.endpoints.dashboard', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute ($stateProvider) {
    $stateProvider.state('endpoints.dashboard', {
      url: '/dashboard',
      templateUrl: 'app/view/endpoints/dashboard/endpoints-dashboard.html',
      controller: EndpointsDashboardController,
      controllerAs: 'endpointsDashboardCtrl'
    });
  }

  EndpointsDashboardController.$inject = [
    'app.model.modelManager',
    'app.api.apiManager',
    'helion.framework.widgets.detailView',
    '$scope',
    '$state',
    'app.view.hceRegistration',
    'app.view.hcfRegistration'
  ];

  /**
   * @namespace app.view.endpoints.hce
   * @memberof app.view.endpoints.hce
   * @name EndpointsDashboardController
   * @param {app.model.modelManager} modelManager - the application model manager
   * @param {app.api.apiManager} apiManager - the api manager
   * @param {helion.framework.widgets.detailView} detailView - the detail view service
   * @param {object} $scope - angular $scope
   * @param {object} $state - the UI router $state service
   * @param {app.view.hceRegistration} hceRegistration - HCE Registration detail view service
   * @param {app.view.hcfRegistration} hcfRegistration - HCF Registration detail view service
   * @constructor
   */
  function EndpointsDashboardController (modelManager, apiManager, detailView, $scope, $state, hceRegistration, hcfRegistration) {

    this.modelManager = modelManager;
    this.serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
    this.serviceInstanceApi = apiManager.retrieve('cloud-foundry.api.ServiceInstances');
    this.currentUserAccount = modelManager.retrieve('app.model.account');
    this.detailView = detailView;
    this.$state = $state;
    this.hceRegistration = hceRegistration;
    this.hcfRegistration = hcfRegistration;

    this.currentEndpoints = [];
    this.serviceInstances = {};

    // Show welcome message only if no endpoints are registered
    this.showWelcomeMessage = this.serviceInstanceModel.serviceInstances.length === 0;
    var that = this;
    this.serviceInstanceModel.list();
    this.clusterAddFlyoutActive = false;

    $scope.$watchCollection(function () {
      return that.serviceInstanceModel.serviceInstances;
    }, function (serviceInstances) {

      if (that.showWelcomeMessage && serviceInstances.length > 0) {
        that.showWelcomeMessage = false;
      }
      _.forEach(serviceInstances, function (serviceInstance) {
        var guid = serviceInstance.guid;
        if (angular.isUndefined(that.serviceInstances[guid])) {
          that.serviceInstances[guid] = serviceInstance;
        } else {
          angular.extend(that.serviceInstances[guid], serviceInstance);
        }
      });

      that.currentEndpoints = _.map(that.serviceInstances,
        function (c) {
          var endpoint = c.api_endpoint;
          return endpoint.Scheme + '://' + endpoint.Host;
        });
    });

  }

  angular.extend(EndpointsDashboardController.prototype, {

    /**
     * @namespace app.view.endpoints.dashboard
     * @memberof app.view.endpoints.dashboard
     * @name showClusterAddForm
     * @description Show cluster add form
     */
    showClusterAddForm: function () {
      if (this.isHcf()) {
        this.hcfRegistration.add();
      } else {
        this.hceRegistration.add();
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
     * @memberOf app.view.endpoints.hce
     * @description Is current user an admin?
     * @returns {Boolean}
     */
    isUserAdmin: function () {
      return this.currentUserAccount.isAdmin();
    }

  });

})();
