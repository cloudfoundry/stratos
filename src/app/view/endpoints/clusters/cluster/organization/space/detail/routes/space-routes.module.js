(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster.organization.space.detail')
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
        label: '{{ clusterSpaceController.space().details.entity.name || "..." }}',
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
    'app.model.modelManager',
    'app.service.serviceManager'
  ];

  function SpaceRoutesController($scope, $stateParams, $q, $log, modelManager, serviceManager) {
    var that = this;
    this.clusterGuid = $stateParams.guid;
    this.organizationGuid = $stateParams.organization;
    this.spaceGuid = $stateParams.space;
    this.$q = $q;
    this.$log = $log;
    this.modelManager = modelManager;
    this.routesService = serviceManager.retrieve('cloud-foundry.service.route');

    this.spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    this.spacePath = this.spaceModel.fetchSpacePath(this.clusterGuid, this.spaceGuid);

    this.apps = {};
    this.actionsPerRoute = {};

    $scope.$watch(function () {
      return that.visibleRoutes;
    }, function (routes) {
      if (!routes) {
        return;
      }
      that.updateActions(routes);
    });
  }

  angular.extend(SpaceRoutesController.prototype, {

    getInitialActions: function () {
      var that = this;
      return [
        {
          name: gettext('Delete Route'),
          disabled: false,
          execute: function (route) {
            that.routesService.deleteRoute(that.clusterGuid, route.entity, route.metadata.guid)
              .then(function () {
                return that.spaceModel.listAllRoutesForSpace(that.clusterGuid, that.spaceGuid);
              })
              .then(function () {
                that.updateActions([route]);
              });
          }
        },
        {
          name: gettext('Unmap Route'),
          disabled: true,
          execute: function (route) {
            var promises = [];
            _.forEach(route.entity.apps, function (app) {
              var promise = that.routesService.unmapRoute(that.clusterGuid, route.entity, route.metadata.guid,
                app.metadata.guid)
                .catch(function () {
                  that.$log.error('Unable to update map for route ', route.metadata.guid);
                });
              promises.push(promise);
            });
            if (promises.length === 0) {
              return;
            }
            that.$q.all(promises).then(function () {
              that.spaceModel.listAllRoutesForSpace(that.clusterGuid, that.spaceGuid).then(function () {
                that.updateActions([route]);
              });
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
      _.forEach(routes, function (route) {
        that.actionsPerRoute[route.metadata.guid] = that.actionsPerRoute[route.metadata.guid] || that.getInitialActions();
        that.actionsPerRoute[route.metadata.guid][1].disabled = _.get(route.entity.apps, 'length', 0) < 1;
        console.log(route);

      });
    },

    spaceDetail: function () {
      return _.get(this.spaceModel, this.spacePath);
    }

  });
})();
