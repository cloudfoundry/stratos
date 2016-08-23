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
    '$state',
    '$stateParams',
    '$q',
    'app.model.modelManager',
    'cloud-foundry.view.applications.services.serviceInstanceService',
    'app.utils.utilsService'
  ];

  function SpaceServicesController($scope, $state, $stateParams, $q, modelManager, serviceInstanceService, utils) {
    var that = this;

    this.clusterGuid = $stateParams.guid;
    this.organizationGuid = $stateParams.organization;
    this.spaceGuid = $stateParams.space;
    this.spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    this.serviceInstanceService = serviceInstanceService;

    this.actionsPerSI = {};

    $scope.$watch(function () {
      return that.visibleServiceInstances;
    }, function (serviceInstances) {
      if (!serviceInstances) {
        return;
      }
      that.updateActions(serviceInstances);
    });

    function init() {
      if (angular.isUndefined(that.spaceDetail().instances)) {
        return that.update();
      }

      return $q.resolve();
    }

    utils.chainStateResolve('endpoint.clusters.cluster.organization.space.detail.routes', $state, init);
  }

  angular.extend(SpaceServicesController.prototype, {
    update: function (serviceInstance) {
      var that = this;
      return this.spaceModel.listAllServiceInstancesForSpace(this.clusterGuid, this.spaceGuid, {
        return_user_provided_service_instances: false
      }, true).then(function () {
        if (serviceInstance) {
          that.updateActions([serviceInstance]);
          that.spaceModel.updateServiceInstanceCount(that.clusterGuid, that.spaceGuid, _.keys(that.spaceDetail().instances).length);
        }
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
      return this.spaceModel.fetchSpace(this.clusterGuid, this.spaceGuid);
    },

    updateActions: function (serviceInstances) {
      var that = this;
      _.forEach(serviceInstances, function (si) {
        that.actionsPerSI[si.metadata.guid] = that.actionsPerSI[si.metadata.guid] || that.getInitialActions();
        that.actionsPerSI[si.metadata.guid][1].disabled = _.get(si.entity.service_bindings, 'length', 0) < 1;
      });
    }

  });
})();
