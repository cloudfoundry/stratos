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
    '$scope',
    '$stateParams',
    '$state',
    '$q',
    'app.model.modelManager',
    'cloud-foundry.view.applications.services.serviceInstanceService',
    'app.utils.utilsService'
  ];

  function SpaceServicesController($scope, $stateParams, $state, $q, modelManager, serviceInstanceService, utils) {
    var that = this;

    this.clusterGuid = $stateParams.guid;
    this.organizationGuid = $stateParams.organization;
    this.spaceGuid = $stateParams.space;
    this.spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    this.spacePath = this.spaceModel.fetchSpacePath(this.clusterGuid, this.spaceGuid);
    this.serviceInstanceService = serviceInstanceService;

    this.actionsPerSI = {};
    this.authService = modelManager.retrieve('cloud-foundry.model.auth');

    $scope.$watch(function () {
      return that.visibleServiceInstances &&
        that.authService.isInitialized();
    }, function (serviceInstances) {

      serviceInstances = that.visibleServiceInstances;
      if (!serviceInstances) {
        return;
      }
      that.updateActions(serviceInstances);
    });

    function init() {
      return $q.resolve();
    }

    utils.chainStateResolve('endpoint.clusters.cluster.organization.detail', $state, init);

  }

  angular.extend(SpaceServicesController.prototype, {
    update: function (serviceInstance) {
      var that = this;
      this.spaceModel.listAllServiceInstancesForSpace(this.clusterGuid, this.spaceGuid).then(function () {
        that.updateActions([serviceInstance]);
      });
    },

    getInitialActions: function () {
      var that = this;
      return [
        {
          name: gettext('Delete Service'),
          disabled: false,
          execute: function (serviceInstance) {
            that.serviceInstanceService.deleteService(that.clusterGuid, serviceInstance.metadata.guid,
              serviceInstance.entity.name, _.bind(that.update, that, serviceInstance));
          }
        },
        {
          name: gettext('Detach Service'),
          disabled: true,
          execute: function (serviceInstance) {
            that.serviceInstanceService.unbindServiceFromApps(that.clusterGuid, serviceInstance.entity.service_bindings,
              serviceInstance.entity.name, _.bind(that.update, that, serviceInstance));
          }
        }
      ];
    },

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
    },

    updateActions: function (serviceInstances) {
      var that = this;
      _.forEach(serviceInstances, function (si) {
        that.actionsPerSI[si.metadata.guid] = that.actionsPerSI[si.metadata.guid] || that.getInitialActions();
        if (that.authService.isInitialized()) {
          that.actionsPerSI[si.metadata.guid][0].disabled = !that.authService.isAllowed('managed_service_instance', 'delete', si);
          that.actionsPerSI[si.metadata.guid][1].disabled = !that.authService.isAllowed('managed_service_instance', 'update', si);
        }
      });
    }

  });
})();
