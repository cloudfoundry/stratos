(function() {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.endpoints', [])
    .config(registerRoute);


  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cf.applications.endpoints-dashboard', {
      url: '/endpoints-dashboard',
      templateUrl: 'plugins/cloud-foundry/view/applications/application/endpoints/endpoints-dashboard.html',
      controller: EndpointsDashboardController,
      controllerAs: 'endpointsDashboardCtrl'
    });
  }

  EndpointsDashboardController.$inject = [
    'app.model.modelManager',
    'app.api.apiManager',
    'helion.framework.widgets.detailView',
    '$scope'
  ];

  function EndpointsDashboardController(modelManager, apiManager, detailView, $scope) {

    this.modelManager = modelManager;
    this.serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
    this.detailView = detailView;
    this.currentEndpoints = [];
    this.serviceInstances = {};
    this.serviceInstanceApi = apiManager.retrieve('cloud-foundry.api.ServiceInstances');

    // Show welcome message only if no endpoints are registered
    this.showWelcomeMessage = this.serviceInstanceModel.serviceInstances.length !== 0;
    var that = this;

    this.clusterAddFlyoutActive = false;

    $scope.$watchCollection(function() {
      return that.serviceInstanceModel.serviceInstances;
    }, function(serviceInstances) {

      if (that.showWelcomeMessage && serviceInstances.length > 0) {
        that.showWelcomeMessage = false;
      }
      _.forEach(serviceInstances, function(serviceInstance) {
        var guid = serviceInstance.guid;
        if (angular.isUndefined(that.serviceInstances[guid])) {
          that.serviceInstances[guid] = serviceInstance;
        } else {
          angular.extend(that.serviceInstances[guid], serviceInstance);
        }
      });

      that.currentEndpoints = _.map(that.serviceInstances,
        function(c) {
          var endpoint = c.api_endpoint;
          return endpoint.Scheme + '://' + endpoint.Host;
        });
    });

  }

  angular.extend(EndpointsDashboardController.prototype, {

    showClusterAddForm: function() {

      var that = this;
      if (this.isHcf()) {
        // TODO(irfan) : HCF is a flyout, both should be detail views
        this.clusterAddFlyoutActive = true;
      } else {
        var data = {name: '', url: ''};
        this.detailView(
          {
            templateUrl: 'app/view/hce-registration/hce-registration.html',
            title: gettext('Register Code Engine Endpoint')
          },
          {
            data: data,
            options: {
              instances: this.currentEndpoints
            }
          }
        ).result.then(function() {
          return that.serviceInstanceApi.createHCE(data.url, data.name).then(function() {
            that.cnsiModel.list();
          });
        });
      }
    },

    hideClusterAddForm: function() {
      this.clusterAddFlyoutActive = false;
    },

    isHcf: function() {
      return this.serviceType === 'hcf';
    },

    hideWelcomeMessage: function() {
      this.showWelcomeMessage = false;
    }

  });

})();
