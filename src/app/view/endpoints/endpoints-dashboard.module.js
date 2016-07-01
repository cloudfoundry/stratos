(function () {
  'use strict';

  angular
    .module('app.view.endpoints', [
      'app.view.endpoints.view'
    ])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute ($stateProvider) {

    $stateProvider.state('appEndpointsDashboard', {
      url: '/endpoints-dashboard',
      templateUrl: 'app/view/endpoints/endpoints-dashboard.html',
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
    'app.view.hceRegistration'
  ];

  function EndpointsDashboardController (modelManager, apiManager, detailView, $scope, $state, hceRegistration) {

    this.modelManager = modelManager;
    this.serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
    this.serviceInstanceApi = apiManager.retrieve('cloud-foundry.api.ServiceInstances');
    this.detailView = detailView;
    this.$state = $state;
    this.hceRegistration = hceRegistration;

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

    showClusterAddForm: function () {

      var that = this;
      if (this.isHcf()) {
        // TODO(irfan) : HCF is a flyout, both should be detail views
        this.clusterAddFlyoutActive = true;
      } else {
        this.hceRegistration.add();
      }
    },

    hideClusterAddForm: function () {
      this.clusterAddFlyoutActive = false;
    },

    isHcf: function () {
      return this.serviceType === 'hcf';
    },

    hideWelcomeMessage: function () {
      this.showWelcomeMessage = false;
    }

  });

})();
