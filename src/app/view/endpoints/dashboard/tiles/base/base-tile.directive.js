(function() {
  'use strict';

  angular
    .module('app.view.endpoints.dashboard')
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
      templateUrl: 'app/view/endpoints/dashboard/tiles/base/base-tile.html'
    };
  }

  BaseTileController.$inject = [
    'app.model.modelManager'
  ];

  /**
   * @memberof cloud-foundry.view.applications.application.endpoints
   * @name BaseTileController
   * @param {app.model.modelManager} modelManager - the Model management service
   * @constructor
   */
  function BaseTileController(modelManager) {
    this.userCnsiModel = modelManager.retrieve('app.model.serviceInstance.user');
    this.userCnsiModel.list();
  }

  angular.extend(BaseTileController.prototype, {


    /**
     * @function getInstancesCount
     * @description Get total number of services
     * @memberOf cloud-foundry.view.applications.application.endpoints
     * @returns {Number} count
     */
    getInstancesCount: function() {
      return _.keys(this.serviceInstances).length;
    },

    /**
     *      * @memberOf cloud-foundry.view.applications.application.endpoints
     getServiceInstanceCount
     * @description Get number of services in a particular status
     * @memberOf cloud-foundry.view.applications.application.endpoints
     * @returns {Number} count
     */
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

    /**
     * @function isHcf
     * @description Is tile an HCF instance?
     * @memberOf cloud-foundry.view.applications.application.endpoints
     * @returns {Boolean}
     */
    isHcf: function() {
      return this.serviceType === 'hcf';
    }
  });
})();
