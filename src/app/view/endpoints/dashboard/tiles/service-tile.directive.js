(function () {
  'use strict';

  angular
    .module('app.view.endpoints.dashboard')
    .directive('serviceTile', serviceTile);

  function serviceTile() {
    return {
      scope: {
        serviceType: '@',
        useCachedData: '=?'
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
  function ServiceTileController($scope, modelManager, $state, hceRegistration, hcfRegistration, $q) {

    var that = this;

    this.modelManager = modelManager;
    this.serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
    this.serviceType = $scope.serviceType;
    this.useCachedData = $scope.useCachedData;
    this.userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
    this.currentUserAccount = modelManager.retrieve('app.model.account');
    this.$state = $state;
    this.hceRegistration = hceRegistration;
    this.hcfRegistration = hcfRegistration;
    this.$q = $q;

    /* eslint-disable no-warning-comments */
    // FIXME We should use ui-router/resolve for this, but can't currently
    /* eslint-enable no-warning-comments */
    this.resolvedPromise = false;

    this.chartLabels = {
      totalOne: gettext('Endpoint'),
      total: gettext('Endpoints'),
      ok: gettext('Connected'),
      critical: gettext('Expired'),
      unknown: gettext('Disconnected')
    };

    this._listServiceInstances()
      .then(function () {
        $scope.$watchCollection(function () {
          return that.serviceInstanceModel.serviceInstances;
        }, function () {
          that._updateInstances();
        });
        $scope.$watchCollection(function () {
          return that.userServiceInstanceModel.serviceInstances;
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
        this.$state.go('endpoint.clusters.router.tiles');
      } else {
        this.$state.go('endpoint.hce', {
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
      var that = this;
      var count = 0;
      var isConnected = status.toLowerCase() === 'connected';
      var isDisconnected = status.toLowerCase() === 'disconnected';
      _.each(_.keys(that.serviceInstances), function (cnsiGuid) {
        if (_.isUndefined(that.userServiceInstanceModel.serviceInstances[cnsiGuid])) {
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
      var promise = this.useCachedData ? this.$q.when(true) : this.$q.all([this.serviceInstanceModel.list(), this.userServiceInstanceModel.list()]);
      return promise.then(function () {
        return that._updateInstances();
      }).then(function () {
        that.resolvedPromise = true;
      });
    },

    _updateChart: function () {
      this.chartData = {
        ok: this.getInstancesCountByStatus('Connected'),
        critical: this.getInstancesCountByStatus('Expired'),
        unknown: this.getInstancesCountByStatus('Disconnected')
      };
    },

    _updateInstances: function () {
      var that = this;

      that.serviceInstances = {};
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

      this._updateChart();
    }

  });

})();
