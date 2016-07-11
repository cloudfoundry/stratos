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
    'app.model.modelManager'
  ];

  /**
   * @name ClusterTileController
   * @constructor
   * @param {object} $scope - the angular $scope service
   * @param {object} $state - the angular $state service
   * @param {app.model.modelManager} modelManager - the Model management service
   * @property {Array} actions - collection of relevant actions that can be executed against cluster
   * @property {number} orgCount - organisation count
   * @property {number} userCount - user count
   * @property {object} cardData - gallery-card directive data object
   */
  function ClusterTileController($scope, $state, modelManager) {
    this.$state = $state;
    this.cfModelUsers = modelManager.retrieve('cloud-foundry.model.users');
    this.cfModelOrg = modelManager.retrieve('cloud-foundry.model.organization');
    this.currentUserAccount = modelManager.retrieve('app.model.account');
    this.userInfo = modelManager.retrieve('app.model.userInfo');

    this.actions = [];
    this.orgCount = null;
    this.userCount = null;
    this.cardData = {
      title: this.service.name
    };
    if (this.service.hasExpired) {
      this.cardData.status = {
        classes: 'danger',
        icon: 'helion-icon-lg helion-icon helion-icon-Critical_S',
        description: gettext('Token has expired')
      };
    }

    var that = this;
    $scope.$watch(function () { return that.service; }, function (newVal) {
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
      // We should look to improve this, maybe overload portal-proxy such that the whole user set has to be retrieved
      // just for the count. This will help in the case the connected user does not have privileges.
      this.cfModelUsers.listAllUsers(this.service.guid).then(function (res) {
        that.userCount = _.get(res, 'length', null);
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
      // We should look to improve this, maybe overload portal-proxy such that the whole user set has to be retrieved
      // just for the count. This will help in the case the connected user does not have privileges.
      this.cfModelOrg.listAllOrganizations(this.service.guid).then(function (res) {
        that.orgCount = _.get(res, 'length', null);
      });
    },

    /**
     * @namespace app.view.endpoints.clusters
     * @memberof app.view.endpoints.clusters
     * @name summary
     * @description Navigate to the cluster summary page for this cluster
     */
    summary: function () {
      this.$state.go('endpoint.clusters.cluster.detail', {guid: this.service.guid});
    }

  });

})();
