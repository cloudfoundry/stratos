(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster.detail', [
      'app.view.endpoints.clusters.cluster.detail.organizations',
      'app.view.endpoints.clusters.cluster.detail.users'
    ])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    console.log('Registering endpoint.clusters.cluster.detail');
    $stateProvider.state('endpoint.clusters.cluster.detail', {
      url: '',
      abstract: true,
      templateUrl: 'app/view/endpoints/clusters/cluster/detail/cluster-detail.html',
      controller: ClusterDetailController,
      controllerAs: 'clusterController'
    });
  }

  ClusterDetailController.$inject = [
    'app.model.modelManager',
    '$stateParams'
  ];

  function ClusterDetailController(modelManager, $stateParams) {
    var that = this;
    this.guid = $stateParams.guid;

    // Get the cluster info
    this.cluster = {
      name: '',
      api_endpoint: ''
    };

    this.cnsiModel = modelManager.retrieve('app.model.serviceInstance.user');
    this.cnsiModel.list().then(function (registeredInstances) {
      that.cluster = registeredInstances[that.guid];
    });

    this.clusterActions = [
      {
        name: gettext('Create Organization'),
        execute: function () {
        },
        icon: 'helion-icon-lg helion-icon helion-icon-Tree'
      },
      {
        name: gettext('Create Space'),
        execute: function () {
        },
        icon: 'helion-icon-lg helion-icon helion-icon-Tree'
      },
      {
        name: gettext('Assign User(s)'),
        execute: function () {
        },
        icon: 'helion-icon-lg helion-icon helion-icon-Add_user'
      }
    ];

  }

  angular.extend(ClusterDetailController.prototype, {});
})();
