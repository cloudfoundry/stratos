(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster.organization.space.detail.services', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster.organization.space.detail.services', {
      url: '/services',
      templateUrl: 'app/view/endpoints/clusters/cluster/organization/space/detail/services/space-services.html',
      controller: SpaceServicesController,
      controllerAs: 'spaceSrvsCtrl',
      ncyBreadcrumb: {
        label: '{{ clusterSpaceController.space().details.entity.name || "..." }}',
        parent: function () {
          return 'endpoint.clusters.cluster.organization.detail.spaces';
        }
      }
    });
  }

  SpaceServicesController.$inject = [
    '$stateParams',
    'app.model.modelManager'
  ];

  function SpaceServicesController($stateParams, modelManager) {

    this.clusterGuid = $stateParams.guid;
    this.organizationGuid = $stateParams.organization;
    this.spaceGuid = $stateParams.space;
    this.spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    this.spacePath = this.spaceModel.fetchSpacePath(this.clusterGuid, this.spaceGuid);

    this.actions = [
      {
        name: gettext('Delete Service'),
        disabled: true,
        execute: function () {
        }
      },
      {
        name: gettext('Detach Service'),
        disabled: true,
        execute: function () {
        }
      }
    ];

  }

  angular.extend(SpaceServicesController.prototype, {

    createApplicationList: function (serviceBindings) {
      return _.chain(serviceBindings)
        .map(function (serviceBinding) {
          return serviceBinding.entity.app.entity.name;
        })
        .sortBy()
        .value()
        .join(', ');
    },

    spaceDetail: function () {
      return _.get(this.spaceModel, this.spacePath);
    }

  });
})();
