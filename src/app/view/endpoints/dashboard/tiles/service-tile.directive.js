(function () {
  'use strict';

  angular
    .module('app.view.endpoints.dashboard')
    .directive('serviceTile', serviceTile);

  function serviceTile () {
    return {
      scope: {
        serviceType: '@'
      },
      controller: ServiceTileController,
      controllerAs: 'serviceTileCtrl',
      templateUrl: 'app/view/endpoints/dashboard/tiles/service-tile.html'
    };
  }

  ServiceTileController.$inject = [
    '$scope',
    'app.model.modelManager',
    'app.api.apiManager',
    '$state',
    'app.view.hceRegistration'

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
  function ServiceTileController ($scope, modelManager, apiManager, $state, hceRegistration) {

    this.modelManager = modelManager;
    this.serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
    this.serviceType = $scope.serviceType;
    this.userServiceInstanceModel =  modelManager.retrieve('app.model.serviceInstance.user');;
    this.$state = $state;
    this.hceRegistration = hceRegistration;

    this.clusterAddFlyoutActive = false;
    this.serviceInstances = {};
    var that = this;

    $scope.$watchCollection(function () {
      return that.serviceInstanceModel.serviceInstances;
    }, function (serviceInstances) {
      var filteredInstances = _.filter(serviceInstances, function (serviceInstance) {
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

    });
  }

  angular.extend(ServiceTileController.prototype, {

    serviceInstancesCount: function () {
      return _.keys(this.serviceInstances).length;
    },

    showClusterAddForm: function () {

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

    goToEndpointsView: function () {
      if (this.isHcf()) {
        this.$state.go('endpoints.hcf');
      } else {
        this.$state.go('endpoints.hce', {
          serviceType: 'hce'
        });
      }
    },

    /**
     * @function getInstancesCount
     * @description Get total number of services
     * @memberOf cloud-foundry.view.applications.application.endpoints
     * @returns {Number} count
     */
    getInstancesCount: function () {
      return _.keys(this.serviceInstances).length;
    },

    /**
     * @function getInstancesCountByStatus
     * @memberOf cloud-foundry.view.applications.application.endpoints
     getServiceInstanceCount
     * @description Get number of services in a particular status
     * @memberOf cloud-foundry.view.applications.application.endpoints
     * @returns {Number} count
     */
    getInstancesCountByStatus: function (status) {
      // TODO
      // If cnsi_type is HCE, then currently.
      // we don't have distinct states for it.
      var count = 0;
      var that = this;
      if (that.serviceType === 'hcf') {
        _.each(_.keys(that.serviceInstances), function (cnsiGuid) {
          var isConnected = status.toLowerCase() === 'connected';
          var isDisconnected = status.toLowerCase() === 'disconnected';
          if (_.isUndefined(that.userServiceInstanceModel.serviceInstances[cnsiGuid])) {
             // disconnected state
            // TODO may not be true when disconnect from instance is implemented
            if (isDisconnected) {
              count += 1;
            }
          } else {
             // valid or expired state
            if (that.userServiceInstanceModel.serviceInstances[cnsiGuid].valid === isConnected) {
              count += 1;
            }
          }
        });
      } else if (this.serviceType === 'hce') {

        if (status.toLowerCase() === 'connected') {
          return _.keys(this.serviceInstances).length;
        }
      }

      return count;
    }

  });

})();
