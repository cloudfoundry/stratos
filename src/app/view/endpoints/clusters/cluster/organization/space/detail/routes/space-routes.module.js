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
        label: gettext('Space'),
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
    'app.model.modelManager'
  ];

  function SpaceRoutesController($scope, $stateParams, $q, modelManager) {
    var that = this;
    this.clusterGuid = $stateParams.guid;
    this.organizationGuid = $stateParams.organization;
    this.spaceGuid = $stateParams.space;
    this.$q = $q;
    this.modelManager = modelManager;

    this.spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    this.spacePath = 'spaces.' + this.clusterGuid + '.' + this.spaceGuid;
    this.privateDomains = modelManager.retrieve('cloud-foundry.model.private-domain');
    this.sharedDomains = modelManager.retrieve('cloud-foundry.model.shared-domain');

    this.apps = {};

    this.actions = [
      {
        // FIXME (RC): This should option should only be shown if user is cf admin (currently blocked)
        name: gettext('Delete Route'),
        disabled: true,
        execute: function () {
        }
      },
      {
        name: gettext('Unmap Route'),
        disabled: true,
        execute: function () {
        }
      }
    ];

    $scope.$watch(function () {
      return that.visibleRoutes;
    }, function (routes) {
      if (!routes) {
        return;
      }
      that.updateMappings(routes);
    });
  }

  angular.extend(SpaceRoutesController.prototype, {

    updateMappings: function (routes) {
      var that = this;
      var routeModel = this.modelManager.retrieve('cloud-foundry.model.route');
      var appModel = this.modelManager.retrieve('cloud-foundry.model.application');
      _.forEach(routes, function (route) {
        if (that.apps[route.metadata.guid]) {
          return;
        }
        that.apps[route.metadata.guid] = [];
        // Route 1:M Route Mapping.
        routeModel.listAllRouteMappingsForRoute(that.clusterGuid, route.metadata.guid)
          .then(function (routeMappings) {
            // Mapping 1:1 Application
            _.forEach(routeMappings, function (routeMapping) {
              // Get the application names, either from cash or refreshed cash
              var summary = _.get(appModel, 'appSummary.' + that.clusterGuid + '.' + routeMapping.entity.app_guid);
              var promise = summary
                ? that.$q.when(summary)
                : appModel.getAppSummary(that.clusterGuid, routeMapping.entity.app_guid).then(function (response) {
                  return response.data[that.clusterGuid];
                });
              // Track the application names per route
              promise.then(function (summary) {
                that.apps[route.metadata.guid].push(summary.name);
              });
            });
          });
      });
    },

    spaceDetail: function () {
      return _.get(this.spaceModel, this.spacePath);
    }

  });
})();
