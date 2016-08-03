(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters.cluster.organization.space.detail')
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
    'app.model.modelManager'
  ];

  function SpaceServicesController($scope, $stateParams, modelManager) {
    var that = this;

    this.clusterGuid = $stateParams.guid;
    this.organizationGuid = $stateParams.organization;
    this.spaceGuid = $stateParams.space;
    this.spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    this.spacePath = this.spaceModel.fetchSpacePath(this.clusterGuid, this.spaceGuid);
    this.serviceBindingModel = modelManager.retrieve('cloud-foundry.model.service-binding');
    this.appModel = modelManager.retrieve('cloud-foundry.model.application');
    this.servicePlanModel = modelManager.retrieve('cloud-foundry.model.service-plan');
    this.serviceModel = modelManager.retrieve('cloud-foundry.model.service');
    this.serviceInstance = modelManager.retrieve('cloud-foundry.model.service-instance');

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

    this.appSummary = {};
    this.servicePlan = {};
    this.service = {};

    this.visibleServiceInstances = [];

    // Try to avoid some thrash by tracking which have been updated this time around.
    this.processed = {};

    $scope.$watch(function () {
      return that.visibleServiceInstances;
    }, function (serviceInstances) {
      that.serviceInstanceChanged(serviceInstances);
    });

  }

  angular.extend(SpaceServicesController.prototype, {

    serviceInstanceChanged: function (serviceInstances) {
      if (!serviceInstances) {
        return;
      }
      var that = this;

      _.forEach(serviceInstances, function (serviceInstance) {
        if (that.processed[serviceInstance.metadata.guid]) {
          return;
        }
        that.processed[serviceInstance.metadata.guid] = true;
        // Discover the application associated with this service instance
        that.serviceInstance.listAllServiceBindingsForServiceInstance(that.clusterGuid, serviceInstance.metadata.guid)
          .then(function (serviceBindings) {
            _.forEach(serviceBindings, function (serviceBinding) {
              if (_.get(that.appModel, 'appSummary.' + that.clusterGuid + '.' + serviceBinding.entity.app_guid)) {
                return;
              }
              that.appModel.getAppSummary(that.clusterGuid, serviceBinding.entity.app_guid);
            });
          });

        // Discover the associated service and service plan of this instance
        that.servicePlanModel.retrieveServicePlan(that.clusterGuid, serviceInstance.entity.service_plan_guid)
          .then(function (servicePlan) {
            that.servicePlan[serviceInstance.metadata.guid] = servicePlan;
            that.serviceModel.retrieveService(that.clusterGuid, servicePlan.entity.service_guid)
              .then(function (response) {
                that.service[serviceInstance.metadata.guid] = response;
              });
          });

      });
    },

    spaceDetail: function () {
      return _.get(this.spaceModel, this.spacePath);
    }

  });
})();
