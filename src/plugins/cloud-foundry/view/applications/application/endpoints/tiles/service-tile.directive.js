(function() {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.endpoints')
    .directive('serviceTile', serviceTile);

  function serviceTile() {
    return {
      scope: {
        serviceType: '@'
      },
      controller: ServiceTileController,
      controllerAs: 'serviceTileCtrl',
      templateUrl: 'plugins/cloud-foundry/view/applications/application/endpoints/tiles/service-tile.html'
    };
  }

  ServiceTileController.$inject = [
    '$scope',
    'app.model.modelManager',
    'app.api.apiManager',
    'helion.framework.widgets.detailView'

  ];

  /**
   *
   * @memberOf cloud-foundry.view.applications.application.endpoints
   * @param $scope
   * @param modelManager
   * @param apiManager
   * @param detailView
   *  @constructor
   */
  function ServiceTileController($scope, modelManager, apiManager, detailView) {

    this.modelManager = modelManager;
    this.serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
    this.serviceType = $scope.serviceType;
    this.serviceInstanceApi = apiManager.retrieve('app.api.serviceInstance');
    this.detailView = detailView;

    this.clusterAddFlyoutActive = false;
    this.serviceInstances = {};
    var that = this;

    $scope.$watchCollection(function () {
      return that.serviceInstanceModel.serviceInstances;
    }, function(serviceInstances) {
      var filteredInstances = _.filter(serviceInstances, function(serviceInstance) {
        return serviceInstance.cnsi_type === that.serviceType;
      });
      _.forEach(filteredInstances, function(serviceInstance) {
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

  angular.extend(ServiceTileController.prototype, {

    serviceInstancesCount: function() {
      return _.keys(this.serviceInstances).length;
    },


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
            that.serviceInstanceModel.list();
          });
        });
      }
    },

    hideClusterAddForm: function() {
      this.clusterAddFlyoutActive = false;
    },

    isHcf: function() {
      return this.serviceType === 'hcf';
    }


  });

})();
