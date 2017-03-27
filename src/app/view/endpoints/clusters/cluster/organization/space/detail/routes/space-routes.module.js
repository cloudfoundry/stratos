(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster.organization.space.detail.routes', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint.clusters.cluster.organization.space.detail.routes', {
      url: '/routes',
      templateUrl: 'app/view/endpoints/clusters/cluster/organization/space/detail/routes/space-routes.html',
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

  SpaceRoutesController.$inject = [
    '$scope',
    '$stateParams',
    '$q',
    '$log',
    '$state',
    'modelManager',
    'app.view.endpoints.clusters.routesService',
    'app.utils.utilsService'
  ];

  function SpaceRoutesController($scope, $stateParams, $q, $log, $state, modelManager, routesService, utils) {
    var that = this;
    this.clusterGuid = $stateParams.guid;
    this.organizationGuid = $stateParams.organization;
    this.spaceGuid = $stateParams.space;
    this.$q = $q;
    this.$log = $log;
    this.modelManager = modelManager;
    this.routesService = routesService;

    this.spaceModel = modelManager.retrieve('cloud-foundry.model.space');

    this.apps = {};
    this.actionsPerRoute = {};
    this.authModel = modelManager.retrieve('cloud-foundry.model.auth');

    $scope.$watch(function () {
      return that.visibleRoutes;
    }, function (routes) {
      if (!routes) {
        return;
      }
      that.updateActions(routes);
    });

    function init() {
      if (angular.isUndefined(that.spaceDetail().routes)) {
        return that.update();
      }

      return $q.resolve();
    }

    utils.chainStateResolve('endpoint.clusters.cluster.organization.space.detail.routes', $state, init);
  }

  angular.extend(SpaceRoutesController.prototype, {

    update: function (route) {
      var that = this;
      return that.spaceModel.listAllRoutesForSpace(that.clusterGuid, that.spaceGuid)
        .then(function () {
          if (route) {
            that.updateActions([route]);
            that.spaceModel.updateRoutesCount(that.clusterGuid, that.spaceGuid, _.keys(that.spaceDetail().routes).length);
          }
        });
    },

    getInitialActions: function () {
      var that = this;
      return [
        {
          name: gettext('Delete Route'),
          disabled: false,
          execute: function (route) {
            that.routesService.deleteRoute(that.clusterGuid, route.entity, route.metadata.guid).then(function () {
              that.update(route);
            });
          }
        },
        {
          name: gettext('Unmap Route'),
          disabled: true,
          execute: function (route) {
            var promise;
            if (route.entity.apps.length > 1) {
              promise = that.routesService.unmapAppsRoute(that.clusterGuid, route.entity, route.metadata.guid,
                _.map(route.entity.apps, 'metadata.guid'));
            } else {
              promise = that.routesService.unmapAppRoute(that.clusterGuid, route.entity, route.metadata.guid,
                route.entity.apps[0].metadata.guid);
            }
            promise.then(function (changeCount) {
              if (changeCount < 1) {
                return;
              }
              that.update(route);
            });

          }
        }
      ];
    },

    appsToNames: function (apps) {
      return _.map(apps, function (app) {
        return app.entity.name;
      });
    },

    updateActions: function (routes) {
      var that = this;
      var space = that.spaceDetail().details.space;
      var canDelete = that.authModel.isAllowed(that.clusterGuid, that.authModel.resources.route, that.authModel.actions.delete, space.metadata.guid);
      var canUnmap = that.authModel.isAllowed(that.clusterGuid, that.authModel.resources.route, that.authModel.actions.update, space.metadata.guid);
      that.canDeleteOrUnmap = canDelete || canUnmap;
      _.forEach(routes, function (route) {
        if (that.canDeleteOrUnmap) {
          that.actionsPerRoute[route.metadata.guid] = that.actionsPerRoute[route.metadata.guid] || that.getInitialActions();
          that.actionsPerRoute[route.metadata.guid][0].disabled = _.get(route.entity.apps, 'length', 0) > 0 || !canDelete;
          that.actionsPerRoute[route.metadata.guid][1].disabled = _.get(route.entity.apps, 'length', 0) < 1 || !canUnmap;
        } else {
          delete that.actionsPerRoute[route.metadata.guid];
        }
      });
    },

    spaceDetail: function () {
      return this.spaceModel.fetchSpace(this.clusterGuid, this.spaceGuid);
    }

  });
})();
