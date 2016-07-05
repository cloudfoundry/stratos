(function () {
  'use strict';

  angular
    .module('app.view.endpoints')
    .directive('clusterTile', ClusterTile);

  ClusterTile.$inject = [];

  function ClusterTile() {
    return {
      bindToController: {
        service: '='
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

  function ClusterTileController($state, modelManager) {
    this.$state = $state;

    this.actions = [];

    if (this.service.isConnected) {
      this.actions.push({
        name: 'Disconnect',
        execute: this.diconnect
      });

      // this.cfModelUsers = modelManager.retrieve('cloud-foundry.model.users');
      //
      // this.cfModelUsers.ListAllUsers(this.service.guid).then(function(res) {
      //   console.log(res);
      // });

    } else {
      this.actions.push({
        name: 'Connect',
        execute: this.connect
      });
    }

    this.actions.push({
        name: 'Unregister',
        execute: this.unregister
      });



  }

  angular.extend(ClusterTileController.prototype, {

    summary: function() {
      this.$state.go('endpoints.cluster', { guid: this.service.guid });
    },

    connect: function() {
      alert('CONNECT CALLED');
    },

    diconnect: function() {
      this.userCnsiModel.disconnect(id)
        .then(function success () {
          delete userServiceInstance.account;
          delete userServiceInstance.token_expiry;
          delete userServiceInstance.valid;
          that.userCnsiModel.numValid -= 1;
          that.cfModel.all();
        });
    },



    unregister: function() {
      var that = this;
      this.cnsiModel.remove(serviceInstance)
        .then(function success () {
          that.serviceInstances = {};
          that.userCnsiModel.list().then(function () {
            angular.extend(that.serviceInstances, that.userCnsiModel.serviceInstances);
            that.cnsiModel.list();
          });
        });
    }

  });

})();
