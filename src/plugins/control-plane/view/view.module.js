(function () {
  'use strict';

  angular
    .module('control-plane.view', [
      'control-plane.view.tiles',
      'control-plane.view.metrics'
    ])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {

    $stateProvider.state('cp', {
      url: '/cp',
      abstract: true,
      template: '<ui-view/>',
      data: {
        activeMenuState: 'cp.list'
      }
    });

    $stateProvider.state('cp.list', {
      url: '',
      // template: '<ui-view/>',
      controller: ControlPlaneRouterController,
      controllerAs: 'cpRouterCtrl',
      ncyBreadcrumb: {
        skip: true
      }
    });
  }

  ControlPlaneRouterController.$inject = [
    '$q',
    '$state',
    'app.model.modelManager',
    'app.utils.utilsService'
  ];

  function ControlPlaneRouterController($q, $state, modelManager, utils) {
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
          var hcpInstances = _.filter(that.serviceInstanceModel.serviceInstances, {cnsi_type: 'hcp'});
          _.forEach(hcpInstances, function (hcpInstance) {
            if (_.get(that.userServiceInstanceModel.serviceInstances[hcpInstance.guid], 'valid', false)) {
              serviceInstanceGuid = hcpInstance.guid;
              connectedInstances += 1;
            }
          });

          if (connectedInstances === 1) {
            // $state.go('cp.endpoint.detail.instances', {guid: serviceInstanceGuid});
          // } else {
            $state.go('cp.tiles', {instancesListed: true});
          }
        });
    }

    utils.chainStateResolve('cp.list', $state, init);
  }

  angular.extend(ControlPlaneRouterController.prototype, {});

})();
