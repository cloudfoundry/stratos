(function () {
  'use strict';

  angular
    .module('app.view.endpoints')
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
      templateUrl: 'app/view/endpoints/clusters/list/cluster-tile/cluster-tile.html'
    };
  }

  ClusterTileController.$inject = [
    '$state',
    'app.model.modelManager'
  ];

  /**
   * @name ClusterTileController
   * @constructor
   * @param {object} $stateParams - the angular $state service
   * @param {app.model.modelManager} modelManager - the Model management service
   * @property {array} actions - collection of relevant actions that can be executed against cluster
   */
  function ClusterTileController($state, modelManager) {
    var that = this;

    this.$state = $state;

    this.actions = [];

    if (this.service.isConnected) {
      this.actions.push({
        name: gettext('Disconnect'),
        execute: function() {
          that.disconnect(that.service.guid);
        }
      });
    } else {
      this.actions.push({
        name: gettext('Connect'),
        execute: function() {
          that.connect(that.service);
        }
      });
    }

    this.actions.push({
        name: gettext('Unregister'),
        execute: function() {
          that.unregister(that.service);
        }
      });
  }

  angular.extend(ClusterTileController.prototype, {

    summary: function() {
      this.$state.go('endpoints.cluster', { guid: this.service.guid });
    }

  });

})();
