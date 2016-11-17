(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.tiles')
    .directive('clusterTile', ClusterTile);

  ClusterTile.$inject = [];

  function ClusterTile() {
    return {
      bindToController: {
        service: '=',
        connect: '=',
        disconnect: '=',
        unregister: '='
      },
      controller: ClusterTileController,
      controllerAs: 'clusterTile',
      scope: {},
      templateUrl: 'app/view/endpoints/clusters/tiles/cluster-tile/cluster-tile.html'
    };
  }

  ClusterTileController.$inject = [
    '$scope',
    '$state',
    'app.model.modelManager',
    'app.api.apiManager',
    'app.utils.utilsService',
    'cloud-foundry.model.modelUtils'
  ];

  /**
   * @name ClusterTileController
   * @constructor
   * @param {object} $scope - the angular $scope service
   * @param {object} $state - the angular $state service
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {app.api.apiManager} apiManager - the API management service
   * @param {app.utils.utilsService} utils - the utils service
   * @param {cloud-foundry.model.modelUtils} modelUtils - service containing general hcf model helpers
   * @property {Array} actions - collection of relevant actions that can be executed against cluster
   * @property {number} orgCount - organisation count
   * @property {number} userCount - user count
   * @property {object} cardData - gallery-card directive data object
   * @property {cloud-foundry.model.modelUtils} modelUtils - service containing general hcf model helpers
   */
  function ClusterTileController($scope, $state, modelManager, apiManager, utils, modelUtils) {
    var that = this;

    this.$state = $state;
    // Need to fetch the total number of organizations and users. To avoid fetching all items, only fetch 1 and read
    // list metadata total_results. In order to do this we must go via the api, not the model.
    this.userApi = apiManager.retrieve('cloud-foundry.api.Users');
    this.organizationApi = apiManager.retrieve('cloud-foundry.api.Organizations');
    this.currentUserAccount = modelManager.retrieve('app.model.account');
    this.stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');
    this.modelUtils = modelUtils;
    var userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');

    this.actions = [];
    this.orgCount = null;
    this.userCount = null;
    this.userService = {};

    var cardData = {};
    var expiredStatus = {
      classes: 'danger',
      icon: 'helion-icon-lg helion-icon helion-icon-Critical_S',
      description: gettext('Token has expired')
    };

    var erroredStatus = {
      classes: 'danger',
      icon: 'helion-icon-lg helion-icon helion-icon-Critical_S',
      description: gettext('Cannot contact endpoint')
    };

    cardData.title = this.service.name;
    this.getCardData = function () {
      if (this.userService.error) {
        cardData.status = erroredStatus;
      } else if (that.service.hasExpired) {
        cardData.status = expiredStatus;
      } else {
        delete cardData.status;
      }
      return cardData;
    };

    function init() {
      $scope.$watch(function () { return that.service; }, function (newVal) {
        if (!newVal) {
          return;
        }
        that.userService = userServiceInstanceModel.serviceInstances[that.service.guid] || {};
        that.setActions();
        that.setOrganisationCount();
        that.setUserCount();
      });
    }

    // Ensure the parent state is fully initialised before we start our own init
    utils.chainStateResolve('endpoint.clusters.tiles', $state, init);
  }

  angular.extend(ClusterTileController.prototype, {

    /**
     * @namespace app.view.endpoints.clusters
     * @memberof app.view.endpoints.clusters
     * @name setActions
     * @description Set the contents of the tile's action menu
     */
    setActions: function () {
      var that = this;
      this.actions = [];

      if (!this.service.isConnected) {
        this.actions.push({
          name: gettext('Connect'),
          execute: function () {
            that.connect(that.service);
          }
        });
      }

      if (this.service.isConnected || this.service.hasExpired) {
        this.actions.push({
          name: gettext('Disconnect'),
          execute: function () {
            that.disconnect(that.service.guid);
          }
        });
      }

      if (this.currentUserAccount.isAdmin()) {
        this.actions.push({
          name: gettext('Unregister'),
          execute: function () {
            that.unregister(that.service);
          }
        });
      }
    },

    /**
     * @namespace app.view.endpoints.clusters
     * @memberof app.view.endpoints.clusters
     * @name setUserCount
     * @description Determine the number of users associated with this cluster
     */
    setUserCount: function () {
      this.userCount = 0;

      if (!this.service.isConnected || this.userService.error ||
        !this.stackatoInfo.info.endpoints.hcf[this.service.guid].user.admin) {
        this.userCount = undefined;
        return;
      }

      var that = this;
      this.userApi.ListAllUsers({'results-per-page': 1}, this.modelUtils.makeHttpConfig(this.service.guid))
        .then(function (response) {
          that.userCount = response.data.total_results;
        })
        .catch(function () {
          that.userCount = undefined;
        });
    },

    /**
     * @namespace app.view.endpoints.clusters
     * @memberof app.view.endpoints.clusters
     * @name setOrganisationCount
     * @description Determine the number of organisations associated with this cluster
     */
    setOrganisationCount: function () {
      this.orgCount = 0;

      if (!this.service.isConnected || this.userService.error) {
        this.orgCount = undefined;
        return;
      }
      var that = this;
      this.organizationApi.ListAllOrganizations({'results-per-page': 1},
        this.modelUtils.makeHttpConfig(this.service.guid))
        .then(function (response) {
          that.orgCount = response.data.total_results;
        })
        .catch(function () {
          that.orgCount = undefined;
        });
    },

    /**
     * @namespace app.view.endpoints.clusters
     * @memberof app.view.endpoints.clusters
     * @name summary
     * @description Navigate to the cluster summary page for this cluster
     */
    summary: function () {
      this.$state.go('endpoint.clusters.cluster.detail.organizations', {guid: this.service.guid});
    }

  });

})();
