(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.dashboard.cluster.detail.securityGroups', [])
    .config(registerRoute);

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster.detail.securityGroups', {
      url: '/securityGroups',
      templateUrl: 'plugins/cloud-foundry/view/dashboard/cluster/detail/security-groups/security-groups.html',
      controller: SecurityGroupsController,
      controllerAs: 'sgCtrl',
      ncyBreadcrumb: {
        label: '{{ clusterController.userServiceInstanceModel.serviceInstances[clusterController.guid].name ||"..." }}',
        parent: function () {
          return 'endpoint.clusters.tiles';
        }
      }
    });
  }

  function SecurityGroupsController($stateParams, modelManager) {
    var vm = this;
    vm.guid = $stateParams.guid;
    vm.users = [];
    vm.consoleInfo = modelManager.retrieve('app.model.consoleInfo');
    vm.securityGroupsModel = modelManager.retrieve('cloud-foundry.model.security-groups');

    vm.secGroups = _.get(vm.securityGroupsModel, 'securityGroups.' + vm.guid);
    vm.error = false;
    vm.stateInitialised = !!vm.secGroups;

    vm.securityGroupsModel.listAllSecurityGroups(vm.guid).then(function (secGroups) {
      vm.secGroups = secGroups;
    }).catch(function () {
      vm.secGroups = [];
      vm.error = true;
    }).finally(function () {
      vm.stateInitialised = true;
    });
  }

})();
