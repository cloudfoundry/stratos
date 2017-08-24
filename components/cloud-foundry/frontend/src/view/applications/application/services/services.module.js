(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.services', [])
    .config(registerRoute)
    .run(registerAppTab);

  function registerRoute($stateProvider) {
    $stateProvider.state('cf.applications.application.services', {
      url: '/services?serviceType',
      templateUrl: 'plugins/cloud-foundry/view/applications/application/services/services.html',
      controller: ApplicationServicesController,
      controllerAs: 'applicationServicesCtrl'
    });
  }

  function registerAppTab($stateParams, cfApplicationTabs) {
    cfApplicationTabs.tabs.push({
      position: 3,
      hide: false,
      uiSref: 'cf.applications.application.services',
      uiSrefParam: function () {
        return {guid: $stateParams.guid};
      },
      label: 'app.app-info.app-tabs.services.label'
    });
  }

  /**
   * @name ApplicationServicesController
   * @constructor
   * @param {object} $scope - the Angular $scope service
   * @param {app.model.modelManager} modelManager - the model management service
   * @param {object} $stateParams - the UI router $stateParams service
   * @property {cloud-foundry.model.space} model - the Cloud Foundry space model
   * @property {cloud-foundry.model.application} model - the Cloud Foundry application model
   * @property {string} id - the application GUID
   * @property {string} cnsiGuid - the CNSI GUID
   * @property {array} services - the services for the space
   * @property {array} serviceCategories - the service categories to filter by
   * @property {string} searchCategory - the category to filter by
   * @property {object} search - the search object for filtering
   * @property {object} category - the search category object for filtering
   */
  function ApplicationServicesController(
    $scope,
    modelManager,
    $stateParams
  ) {
    var that = this;
    that.$stateParams = $stateParams;
    this.model = modelManager.retrieve('cloud-foundry.model.space');
    this.appModel = modelManager.retrieve('cloud-foundry.model.application');
    this.id = $stateParams.guid;
    this.cnsiGuid = $stateParams.cnsiGuid;
    this.services = [];
    this.serviceCategories = [
      { label: 'app.app-info.app-tabs.services.categories.attached', value: 'attached' },
      { label: 'app.app-info.app-tabs.services.categories.all', value: 'all' }
    ];
    this.searchCategory = 'all';
    this.search = {};
    this.category = {
      entity: {
        extra: undefined
      }
    };
    this.ready = false;

    $scope.$watch(function () {
      return that.appModel.application.summary.guid;
    }, function () {
      var summary = that.appModel.application.summary;
      var spaceGuid = summary.space_guid;
      if (spaceGuid) {
        that.model.listAllServiceInstancesForSpace(that.cnsiGuid, spaceGuid)
          .then(function (serviceInstances) {
            // Get any extra service data
            // and get the categories from services
            return {
              categories: that.getServiceCategories(serviceInstances),
              services: that.getExtraServiceData(serviceInstances)
            };
          })
          .then(function (data) {
            // Attach data to controller
            that.categories = data.categories;
            that.services = data.services;
            that.ready = true;
          });
      }
    });

    function getCurrentAppBinding(serviceInstance) {
      if (
        !serviceInstance.entity.service_bindings ||
        serviceInstance.entity.service_bindings.length === 0
      ) {
        return null;
      }
      return _.find(serviceInstance.entity.service_bindings, function (binding) {
        return binding.entity.app_guid === that.appModel.application.summary.guid;
      }) || null;
    }

    function getServiceInstanceType(serviceInstance) {
      return serviceInstance.entity.service_plan.entity.service.entity.label;
    }

    that.showInstance = function (serviceInstance) {
      var isOfType = !$stateParams.serviceType ||
        $stateParams.serviceType === getServiceInstanceType(serviceInstance);
      var isBoundToThisApp = !!getCurrentAppBinding(serviceInstance);

      return isBoundToThisApp && isOfType;
    };

    that.getExtraServiceData = function (services) {
      return _.chain(services)
        .map(function (service) {
          if (angular.isString(service.entity.extra)) {
            service.entity.extra = angular.fromJson(service.entity.extra);
          }
          return service;
        })
        .sortBy('entity.type')
        .value();
    };

    that.getServiceCategories = function (services) {
      return _.chain(services)
        .flatMap(function (service) {
          return service.entity && service.entity.extra
            ? service.entity.extra.Categories : [] || [];
        })
        .uniq()
        .map(function (cat) {
          return {
            label: cat,
            value: { Categories: cat },
            lower: cat.toLowerCase()
          };
        })
        .sortBy('lower')
        .value();
    };

    $scope.$watch(function () {
      return that.searchCategory;
    }, function (newSearchCategory) {
      if (newSearchCategory === 'attached') {
        that.category.entity.extra = undefined;
        that.category.attached = true;
      } else {
        delete that.category.attached;
        that.category.entity.extra = newSearchCategory === 'all' ? undefined : newSearchCategory;
      }
    });
  }

})();
