(function () {
  'use strict';

  angular
    .module('service-manager.view', [
      'service-manager.view.tiles',
      'service-manager.view.service',
      'service-manager.view.service.instance-detail',
      'service-manager.view.service.service-detail',
      'service-manager.view.manage-instance'
    ])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {

    $stateProvider.state('sm', {
      url: '/sm',
      abstract: true,
      template: '<ui-view/>',
      data: {
        activeMenuState: 'sm.list'
      }
    });

    $stateProvider.state('sm.list', {
      url: '/sm',
      template: '<ui-view/>',
      controller: ServicesManagersRouterController,
      controllerAs: 'smRouterCtrl',
      ncyBreadcrumb: {
        skip: true
      }
    });
  }

  ServicesManagersRouterController.$inject = [
    '$q',
    '$state',
    'modelManager',
    'app.utils.utilsService'
  ];

  /**
   * @name ServicesManagersRouterController
   * @description Redirects the user to either the Tiles page ot the detail
   * page for a given HSM Detail page or  depending on the number of HSM instances connected.
   * @param {object} $q - the Angular $q service
   * @param {object} $state - the UI router $state service
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {app.utils.utilsService} utils - the utils service
   * @constructor
   */
  function ServicesManagersRouterController($q, $state, modelManager, utils) {
    var that = this;
    this.modelManager = modelManager;
    this.$q = $q;
    this.serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
    this.userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');

    function init() {
      return that.$q.all([that.serviceInstanceModel.list(), that.userServiceInstanceModel.list()])
        .then(function () {
          var connectedInstances = 0;
          var serviceInstanceGuid;
          var hcfInstances = _.filter(that.serviceInstanceModel.serviceInstances, {cnsi_type: 'hsm'});
          _.forEach(hcfInstances, function (hcfInstance) {
            if (_.get(that.userServiceInstanceModel.serviceInstances[hcfInstance.guid], 'valid', false)) {
              serviceInstanceGuid = hcfInstance.guid;
              connectedInstances += 1;
            }
          });

          if (connectedInstances === 1) {
            $state.go('sm.endpoint.detail.instances', {guid: serviceInstanceGuid});
          } else {
            $state.go('sm.tiles', {instancesListed: true});
          }
        });
    }

    utils.chainStateResolve('sm.list', $state, init);
  }

  angular.extend(ServicesManagersRouterController.prototype, {});

})();
