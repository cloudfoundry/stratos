(function () {
  'use strict';

  angular
    .module('app.view.endpoints')
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
    '$state',
    'app.view.hceRegistration',
    'app.view.hcfRegistration'

  ];

  /**
   * @namespace app.view.hcfRegistration.serviceTile
   * @memberof app.view.hcfRegistration
   * @name ServiceTileController
   * @description Controller for HCE Endpoints View
   * @param {object} $scope - angular $scope
   * @param {app.model.modelManager} modelManager - the application model manager
   * @param {object} $state - the UI router $state service
   * @param {app.view.hceRegistration} hceRegistration - HCE Registration detail view service
   * @param {app.view.hcfRegistration} hcfRegistration - HCF Registration detail view service
   * @constructor
   */
  function ServiceTileController ($scope, modelManager, $state, hceRegistration, hcfRegistration) {

    this.modelManager = modelManager;
    this.serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
    this.serviceType = $scope.serviceType;
    this.userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
    this.currentUserAccount = modelManager.retrieve('app.model.account');
    this.$state = $state;
    this.hceRegistration = hceRegistration;
    this.hcfRegistration = hcfRegistration;

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

    /**
     * @namespace app.view.endpoints.dashboard.serviceTile
     * @memberof app.view.endpoints.dashboard
     * @name serviceInstancesCount
     * @description Get number of services
     * @param {number} service number
     */
    serviceInstancesCount: function () {
      return _.keys(this.serviceInstances).length;
    },

    /**
     * @namespace app.view.endpoints.dashboard.serviceTile
     * @memberof app.view.endpoints.dashboard
     * @name showClusterAddForm
     * @description Show appropriate cluster add form
     */
    showClusterAddForm: function () {

      if (this.isHcf()) {
        this.hcfRegistration.add();
      } else {
        this.hceRegistration.add();
      }
    },

    /**
     * @namespace app.view.endpoints.dashboard.serviceTile
     * @memberof app.view.endpoints.dashboard
     * @name isHcf
     * @description Check if endpoint view instance is an HCF instance
     * @return {Boolean}
     */
    isHcf: function () {
      return this.serviceType === 'hcf';
    },

    /**
     * @namespace app.view.endpoints.dashboard.serviceTile
     * @memberof app.view.endpoints.dashboard
     * @name goToEndpointsView
     * @description Show drill down view
     */
    goToEndpointsView: function () {
      if (this.isHcf()) {
        this.$state.go('endpoints.clusters');
      } else {
        this.$state.go('endpoints.hce', {
          serviceType: 'hce'
        });
      }
    },

    /**
     * @function getInstancesCountByStatus
     * @memberOf app.view.endpoints.dashboard
     * @namespace app.view.endpoints.dashboard.getServiceInstanceCount
     * @description Get number of services in a particular status
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
          } else if (!isDisconnected) {
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
