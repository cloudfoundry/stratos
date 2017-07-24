(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.dashboard.cluster.organization.space.detail.services', [])
    .config(registerRoute)
    .run(registerTab);

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster.organization.space.detail.services', {
      url: '/services',
      templateUrl: 'plugins/cloud-foundry/view/dashboard/cluster/organization/space/detail/services/space-services.html',
      controller: SpaceServicesController,
      controllerAs: 'spaceSrvsCtrl',
      ncyBreadcrumb: {
        label: '{{ clusterSpaceController.space().details.space.entity.name || "..." }}',
        parent: function () {
          return 'endpoint.clusters.cluster.organization.detail.spaces';
        }
      }
    });
  }

  function registerTab(cfTabs) {
    cfTabs.spaceTabs.push({
      position: 2,
      hide: false,
      uiSref: 'endpoint.clusters.cluster.organization.space.detail.services',
      uiSrefParam: _.noop,
      label: 'cf.space-info.tabs.services.title'
    });
  }

  function SpaceServicesController($scope, $state, $stateParams, $q, modelManager, cfServiceInstanceService,
                                   appUtilsService) {
    var vm = this;

    vm.clusterGuid = $stateParams.guid;
    vm.organizationGuid = $stateParams.organization;
    vm.spaceGuid = $stateParams.space;
    vm.serviceInstances = null;
    vm.actionsPerSI = {};
    vm.canDeleteOrUnbind = false;
    vm.visibleServiceInstances = null;
    vm.createApplicationList = createApplicationList;
    vm.spaceDetail = spaceDetail;
    vm.update = update;

    var spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    var authModel = modelManager.retrieve('cloud-foundry.model.auth');

    $scope.$watch(function () {
      return vm.visibleServiceInstances;
    }, function (serviceInstances) {
      if (!serviceInstances) {
        return;
      }
      updateActions(serviceInstances);
    });

    appUtilsService.chainStateResolve('endpoint.clusters.cluster.organization.space.detail.services', $state, init);

    function init() {
      if (angular.isUndefined(spaceDetail().instances)) {
        return update();
      }
      vm.serviceInstances = spaceDetail().instances;
      return $q.resolve();
    }

    function update(serviceInstance) {
      return spaceModel.listAllServiceInstancesForSpace(vm.clusterGuid, vm.spaceGuid, {
        return_user_provided_service_instances: true
      }).then(function () {
        vm.serviceInstances = spaceDetail().instances;
        if (serviceInstance) {
          updateActions([serviceInstance]);
          spaceModel.updateServiceInstanceCount(vm.clusterGuid, vm.spaceGuid, _.keys(spaceDetail().instances).length);
        }
      });
    }

    function getInitialActions() {
      return [
        {
          name: 'cf.space-info.delete-service-action',
          disabled: false,
          execute: function (serviceInstance) {
            cfServiceInstanceService.deleteService(vm.clusterGuid, serviceInstance.metadata.guid,
              serviceInstance.entity.name, _.bind(update, vm, serviceInstance));
          }
        },
        {
          name: 'cf.space-info.detach-service-action',
          disabled: true,
          execute: function (serviceInstance) {
            cfServiceInstanceService.unbindServiceFromApps(vm.clusterGuid, serviceInstance.entity.service_bindings,
              serviceInstance.entity.name, _.bind(update, vm, serviceInstance));
          }
        }
      ];
    }

    function createApplicationList(serviceBindings) {
      return _.chain(serviceBindings)
        .map(function (serviceBinding) {
          return serviceBinding.entity.app.entity.name;
        })
        .sortBy()
        .value()
        .join(', ');
    }

    function spaceDetail() {
      return spaceModel.fetchSpace(vm.clusterGuid, vm.spaceGuid);
    }

    function updateActions(serviceInstances) {
      var space = spaceDetail().details.space;
      var canDelete = authModel.isAllowed(vm.clusterGuid, authModel.resources.managed_service_instance, authModel.actions.delete, space.metadata.guid);
      var canUnbind = authModel.isAllowed(vm.clusterGuid, authModel.resources.managed_service_instance, authModel.actions.update, space.metadata.guid);
      vm.canDeleteOrUnbind = canDelete || canUnbind;
      _.forEach(serviceInstances, function (si) {
        if (vm.canDeleteOrUnbind) {
          vm.actionsPerSI[si.metadata.guid] = vm.actionsPerSI[si.metadata.guid] || getInitialActions();
          vm.actionsPerSI[si.metadata.guid][0].disabled = _.get(si.entity.service_bindings, 'length', 0) > 0 || !canDelete;
          vm.actionsPerSI[si.metadata.guid][1].disabled = _.get(si.entity.service_bindings, 'length', 0) < 1 || !canUnbind;
        } else {
          delete vm.actionsPerSI[si.metadata.guid];
        }
      });
    }

  }
})();
