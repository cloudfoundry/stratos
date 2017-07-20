(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.dashboard.cluster.organization.space.detail.routes', [])
    .config(registerRoute)
    .run(registerTab);

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster.organization.space.detail.routes', {
      url: '/routes',
      templateUrl: 'plugins/cloud-foundry/view/dashboard/cluster/organization/space/detail/routes/space-routes.html',
      controller: SpaceRoutesController,
      controllerAs: 'spaceRoutesCtrl',
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
      position: 3,
      hide: false,
      uiSref: 'endpoint.clusters.cluster.organization.space.detail.routes',
      uiSrefParam: _.noop,
      label: 'cf.space-info.tabs.routes.title'
    });
  }

  function SpaceRoutesController($scope, $stateParams, $q, $state, modelManager, appClusterRoutesService, appUtilsService) {
    var vm = this;

    vm.clusterGuid = $stateParams.guid;
    vm.organizationGuid = $stateParams.organization;
    vm.spaceGuid = $stateParams.space;
    vm.appClusterRoutesService = appClusterRoutesService;
    vm.visibleRoutes = null;
    vm.actionsPerRoute = {};
    vm.canDeleteOrUnmap = false;
    vm.appsToNames = appsToNames;
    vm.spaceDetail = spaceDetail;

    $scope.$watch(function () {
      return vm.visibleRoutes;
    }, function (routes) {
      if (!routes) {
        return;
      }
      updateActions(routes);
    });

    appUtilsService.chainStateResolve('endpoint.clusters.cluster.organization.space.detail.routes', $state, init);

    function init() {
      if (angular.isUndefined(spaceDetail().routes)) {
        return update();
      }

      return $q.resolve();
    }

    function update(route) {
      var spaceModel = modelManager.retrieve('cloud-foundry.model.space');
      return spaceModel.listAllRoutesForSpace(vm.clusterGuid, vm.spaceGuid)
        .then(function () {
          if (route) {
            updateActions([route]);
            spaceModel.updateRoutesCount(vm.clusterGuid, vm.spaceGuid, _.keys(vm.spaceDetail().routes).length);
          }
        });
    }

    function getInitialActions() {
      return [
        {
          name: 'cf.space-info.delete-route-action',
          disabled: false,
          execute: function (route) {
            appClusterRoutesService.deleteRoute(vm.clusterGuid, route.entity, route.metadata.guid).then(function () {
              update(route);
            });
          }
        },
        {
          name: 'cf.space-info.unmap-route-action',
          disabled: true,
          execute: function (route) {
            var promise;
            if (route.entity.apps.length > 1) {
              promise = appClusterRoutesService.unmapAppsRoute(vm.clusterGuid, route.entity, route.metadata.guid,
                _.map(route.entity.apps, 'metadata.guid'));
            } else {
              promise = appClusterRoutesService.unmapAppRoute(vm.clusterGuid, route.entity, route.metadata.guid,
                route.entity.apps[0].metadata.guid);
            }
            promise.then(function (changeCount) {
              if (changeCount < 1) {
                return;
              }
              update(route);
            });

          }
        }
      ];
    }

    function appsToNames(apps) {
      return _.map(apps, function (app) {
        return app.entity.name;
      });
    }

    function updateActions(routes) {
      var authModel = modelManager.retrieve('cloud-foundry.model.auth');
      var space = spaceDetail().details.space;
      var canDelete = authModel.isAllowed(vm.clusterGuid, authModel.resources.route, authModel.actions.delete, space.metadata.guid);
      var canUnmap = authModel.isAllowed(vm.clusterGuid, authModel.resources.route, authModel.actions.update, space.metadata.guid);
      vm.canDeleteOrUnmap = canDelete || canUnmap;
      _.forEach(routes, function (route) {
        if (vm.canDeleteOrUnmap) {
          vm.actionsPerRoute[route.metadata.guid] = vm.actionsPerRoute[route.metadata.guid] || getInitialActions();
          vm.actionsPerRoute[route.metadata.guid][0].disabled = _.get(route.entity.apps, 'length', 0) > 0 || !canDelete;
          vm.actionsPerRoute[route.metadata.guid][1].disabled = _.get(route.entity.apps, 'length', 0) < 1 || !canUnmap;
        } else {
          delete vm.actionsPerRoute[route.metadata.guid];
        }
      });
    }

    function spaceDetail() {
      var spaceModel = modelManager.retrieve('cloud-foundry.model.space');
      return spaceModel.fetchSpace(vm.clusterGuid, vm.spaceGuid);
    }

  }
})();
