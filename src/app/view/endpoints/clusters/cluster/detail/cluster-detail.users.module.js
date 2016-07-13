(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster.detail.users', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster.detail.users', {
      url: '/users',
      templateUrl: 'app/view/endpoints/clusters/cluster/detail/cluster-detail-users.html',
      controller: ClusterUsersController,
      controllerAs: 'clusterUsersController'
    });
  }

  ClusterUsersController.$inject = [
    'app.model.modelManager',
    '$stateParams',
    '$log'
  ];

  function ClusterUsersController(modelManager, $stateParams, $log) {
    this.guid = $stateParams.guid;
    this.usersModel = modelManager.retrieve('cloud-foundry.model.users');
    this.usersModel.listAllUsers(this.guid, {}).then(function (res) {
      $log.debug('Received list of Users: ', res);
    });
  }

  angular.extend(ClusterUsersController.prototype, {});
})();
