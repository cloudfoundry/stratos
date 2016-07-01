(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.endpoints.view', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute ($stateProvider) {
    $stateProvider.state('cf.endpoints-view', {
      url: '/endpoints-view/:serviceType',
      templateUrl: 'plugins/cloud-foundry/view/applications/application/endpoints/endpoints-view.html',
      controller: EndpointsViewController,
      controllerAs: 'endpointsViewCtrl'
    });
  }

  EndpointsViewController.$inject = [
    'app.model.modelManager',
    'app.api.apiManager',
    '$stateParams',
    'helion.framework.widgets.detailView',
    '$scope'
  ];

  function EndpointsViewController (modelManager, apiManager, $stateParams, detailView, $scope) {


    this.modelManager = modelManager;
    this.serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
    this.serviceInstanceApi = apiManager.retrieve('cloud-foundry.api.ServiceInstances');
    this.detailView = detailView;
    this.serviceType = $stateParams.serviceType;
    this.currentEndpoints = [];
    this.serviceInstances = {};
    this.clusterAddFlyoutActive = true;

    var that = this;
    this.serviceInstanceModel.list();

    // FIXME there is got to be a better way than this?
    this.showDropdown = {};
    $scope.$watchCollection(function () {
      return that.serviceInstanceModel.serviceInstances;
    }, function (serviceInstances) {

      var filteredInstances = _.filter(serviceInstances, function(serviceInstance) {
        return serviceInstance.cnsi_type === that.serviceType;
      });
      _.forEach(filteredInstances, function (serviceInstance) {
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

          return {
            name: c.name,
            url: endpoint.Scheme + '://' + endpoint.Host,
            connected: true
          };
        });
    });
  }

  angular.extend(EndpointsViewController.prototype, {

    connect: function (serviceInstance) {
      // TODO implement HCE authentication
    },

    disconnect: function (serviceInstance) {
      // TODO implement HCE authentication
    },

    unregister: function (serviceInstance) {
      // TODO remove...
    },

    showClusterAddForm: function () {

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
        ).result.then(function () {
          return that.serviceInstanceApi.createHCE(data.url, data.name).then(function () {
            that.cnsiModel.list();
          });
        });
      }
    },
    isDisconnected: function () {
      // TODO implement HCE authentication
    },
    isConnected: function () {
      // TODO implement HCE authentication
      return true;
    },

    setShowDropdown: function (index) {
      var that = this;
      if (this.showDropdown[index]) {
        this.showDropdown[index] = false;
        return;
      } else {
        _.each(_.keys(this.showDropdown), function (rowIndex) {
          that.showDropdown[rowIndex] = false;
        });
        this.showDropdown[index] = true;
      }
    },

    isHcf: function () {
      return this.serviceType === 'hcf';
    }
  });
})();
