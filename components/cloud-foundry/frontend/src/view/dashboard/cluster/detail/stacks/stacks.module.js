(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.dashboard.cluster.detail.stacks', [])
    .config(registerRoute);

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster.detail.stacks', {
      url: '/stacks',
      templateUrl: 'plugins/cloud-foundry/view/dashboard/cluster/detail/stacks/stacks.html',
      controller: StacksController,
      controllerAs: 'stacksCtrl',
      ncyBreadcrumb: {
        label: '{{ clusterController.userServiceInstanceModel.serviceInstances[clusterController.guid].name ||"..." }}',
        parent: function () {
          return 'endpoint.clusters.tiles';
        }
      }
    });
  }

  function StacksController($stateParams, modelManager) {
    var vm = this;
    vm.guid = $stateParams.guid;
    vm.users = [];
    vm.consoleInfo = modelManager.retrieve('app.model.consoleInfo');
    vm.stacksModel = modelManager.retrieve('cloud-foundry.model.stacks');

    vm.stacks = _.get(vm.stacksModel.stacks, vm.guid);
    vm.error = false;
    vm.stateInitialised = !!vm.stacks;

    vm.stacksModel.listAllStacks(vm.guid).then(function (stacks) {
      vm.stacks = stacks;
    }).catch(function () {
      vm.stacks = [];
      vm.error = true;
    }).finally(function () {
      vm.stateInitialised = true;
    });
  }

})();
