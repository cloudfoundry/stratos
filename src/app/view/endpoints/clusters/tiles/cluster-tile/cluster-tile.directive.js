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
    'app.api.apiManager'
  ];

  /**
   * @name ClusterTileController
   * @constructor
   * @param {object} $scope - the angular $scope service
   * @param {object} $state - the angular $state service
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {app.api.apiManager} apiManager - the API management service
   * @property {Array} actions - collection of relevant actions that can be executed against cluster
   * @property {number} orgCount - organisation count
   * @property {number} userCount - user count
   * @property {object} cardData - gallery-card directive data object
   */
  function ClusterTileController($scope, $state, modelManager, apiManager) {
    var that = this;

    var passThroughHeader = {
      'x-cnap-passthrough': 'true'
    };

    this.makeHttpConfig = function (cnsiGuid) {
      var headers = {'x-cnap-cnsi-list': cnsiGuid};
      angular.extend(headers, passThroughHeader);
      return {
        headers: headers
      };
    };

    this.$state = $state;
    // Need to fetch the total number of organizations and users. To avoid fetching all items, only fetch 1 and read
    // list metadata total_results. In order to do this we must go via the api, not the model.
    this.userApi = apiManager.retrieve('cloud-foundry.api.Users');
    this.organizationApi = apiManager.retrieve('cloud-foundry.api.Organizations');
    this.currentUserAccount = modelManager.retrieve('app.model.account');
    this.stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');

    this.actions = [];
    this.orgCount = null;
    this.userCount = null;

    var cardData = {};
    var expiredStatus = {
      classes: 'danger',
      icon: 'helion-icon-lg helion-icon helion-icon-Critical_S',
      description: gettext('Token has expired')
    };

    cardData.title = this.service.name;
    this.getCardData = function () {
      if (that.service.hasExpired) {
        cardData.status = expiredStatus;
      } else {
        delete cardData.status;
      }
      return cardData;
    };

    $scope.$watch(function () { return _.get(that.service, 'guid'); }, function (newVal) {
      if (!newVal) {
        return;
      }
      that.setActions();
      that.setOrganisationCount();
      that.setUserCount();
    });
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

      if (this.service.isConnected) {
        this.actions.push({
          name: gettext('Disconnect'),
          execute: function () {
            that.disconnect(that.service.guid);
          }
        });
      } else {
        this.actions.push({
          name: gettext('Connect'),
          execute: function () {
            that.connect(that.service);
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
      if (!this.service.isConnected) {
        return;
      }

      var that = this;

      this.userApi.ListAllUsers({'results-per-page': 1}, this.makeHttpConfig(this.service.guid))
        .then(function (response) {
          that.userCount = response.data.total_results;
        });
    },

    /**
     * @namespace app.view.endpoints.clusters
     * @memberof app.view.endpoints.clusters
     * @name setOrganisationCount
     * @description Determine the number of organisations associated with this cluster
     */
    setOrganisationCount: function () {
      if (!this.service.isConnected) {
        return;
      }
      var that = this;
      this.organizationApi.ListAllOrganizations({'results-per-page': 1}, this.makeHttpConfig(this.service.guid))
        .then(function (response) {
          that.orgCount = response.data.total_results;
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
