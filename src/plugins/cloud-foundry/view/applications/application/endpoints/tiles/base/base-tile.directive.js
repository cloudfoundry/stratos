(function() {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.endpoints')
    .directive('baseTile', baseTile);

  function baseTile() {
    return {
      restrict: 'E',
      bindToController: {
        serviceInstances: '=',
        serviceType: '@'
      },
      controller: BaseTileController,
      controllerAs: 'baseTileCtrl',
      templateUrl: 'plugins/cloud-foundry/view/applications/application/endpoints/tiles/base/base-tile.html'
    };
  }

  BaseTileController.$inject = [
    '$scope',
    'app.model.modelManager'
  ];

  function BaseTileController($scope, modelManager) {
    this.userCnsiModel = modelManager.retrieve('app.model.serviceInstance.user');
    this.userCnsiModel.list();
  }

  angular.extend(BaseTileController.prototype, {


    getInstancesCount: function() {
      return _.keys(this.serviceInstances).length;
    },

    getServiceInstanceCount: function(status) {
      // TODO
      // If cnsi_type is HCE, then currently.
      // we don't have distinct states for it.
      var count = 0;
      var that = this;
      if (that.serviceType === 'hcf' && status.toLowerCase() !== 'disconnected') {
        _.each(_.keys(that.serviceInstances), function(cnsiGuid) {
          var isConnected = status.toLowerCase() === 'connected';

          if (!_.isUndefined(that.userCnsiModel.serviceInstances[cnsiGuid]) &&
            that.userCnsiModel.serviceInstances[cnsiGuid].valid === isConnected) {
            count += 1;
          }
        });
      } else if (this.serviceType === 'hce') {

        if (status.toLowerCase() === 'connected') {
          return _.keys(this.serviceInstances).length;
        }
      }

      return count;
    },

    isHcf: function() {
      return this.serviceType === 'hcf';
    }
  });
})();
