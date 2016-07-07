(function () {
  'use strict';

  angular
    .module('app.view.endpoints.dashboard')
    .directive('serviceTile', serviceTile);

  function serviceTile () {
    return {
      scope: {
        serviceType: '@',
        serviceInstances: '=?'
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
    'app.view.hcfRegistration',
    '$q'
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
   * @param {object} $q - the Angular $q service
   * @constructor
   */
  function ServiceTileController ($scope, modelManager, $state, hceRegistration, hcfRegistration, $q) {

    this.modelManager = modelManager;
    this.serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
    this.serviceType = $scope.serviceType;
    this.userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
    this.currentUserAccount = modelManager.retrieve('app.model.account');
    this.$state = $state;
    this.hceRegistration = hceRegistration;
    this.hcfRegistration = hcfRegistration;
    this.$q = $q;
    this.serviceInstances = _.filter($scope.serviceInstances, {cnsi_type: this.serviceType});
    // FIXME We should use ui-router/resolve for this, but can't currently
    this.resolvedPromise = false;
    var that = this;
    this._listServiceInstances()
      .then(function () {
        $scope.$watchCollection(function () {
          return that.serviceInstanceModel.serviceInstances;
        }, function () {
          that._updateInstances();
        });
      });
  }

  angular.extend(ServiceTileController.prototype, {

    /**
     * @namespace app.view.endpoints.dashboard.serviceTile
     * @memberof app.view.endpoints.dashboard
     * @name serviceInstancesCount
     * @description Get number of services
     * @returns {Number} number of serviceInstances
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

      var that = this;
      if (this.isHcf()) {
        this.hcfRegistration.add()
          .then(function () {
            return that._listServiceInstances;
          });
      } else {
        this.hceRegistration.add()
          .then(function () {
            return that._listServiceInstances;
          });
      }
    },

    /**
     * @namespace app.view.endpoints.dashboard.serviceTile
     * @memberof app.view.endpoints.dashboard
     * @name isHcf
     * @description Check if endpoint view instance is an HCF instance
     * @returns {Boolean}
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
     * @param {string} status status
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
    },

    _listServiceInstances: function () {

      var that = this;
      return this.$q.all([this.serviceInstanceModel.list(), this.userServiceInstanceModel.list()])
        .then(function () {
          return that._updateInstances();
        }).then(function () {
          that.resolvedPromise = true;
        });
    },

    _updateInstances: function () {

      var that = this;
      var filteredInstances = _.filter(this.serviceInstanceModel.serviceInstances, function (serviceInstance) {
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
    }

  });

})();
