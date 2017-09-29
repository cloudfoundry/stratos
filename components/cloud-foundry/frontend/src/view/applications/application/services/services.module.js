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
        return { guid: $stateParams.guid };
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
   * @param {object} $state - the UI router $state service
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
    $stateParams,
    $state
  ) {
    var that = this;
    that.model = modelManager.retrieve('cloud-foundry.model.space');
    that.appModel = modelManager.retrieve('cloud-foundry.model.application');
    that.id = $stateParams.guid;
    that.cnsiGuid = $stateParams.cnsiGuid;
    that.managingType = $stateParams.serviceType;
    that.services = [];
    that.ALL_FILTER = 'all';
    that.filterType = $stateParams.serviceType || that.ALL_FILTER;
    that.search = {};

    that.ready = false;

    if ($stateParams.serviceType) {
      // Make sure we clear the serviceType url param if the user changes the filter
      var stopFilterWatch = $scope.$watch(function () {
        return that.filterType;
      }, function () {
        if (that.filterType !== $stateParams.serviceType) {
          stopFilterWatch();
          $stateParams.serviceType = null;
          that.managingType = null;
          $state.go('.', $stateParams, { notify: false });
        }
      });
    }

    var stopSummaryWatch = $scope.$watch(function () {
      return that.appModel.application.summary;
    }, function (summary) {
      if (summary.guid) {
        stopSummaryWatch();
        var spaceGuid = summary.space_guid;
        if (spaceGuid) {
          that.model.listAllServiceInstancesForSpace(that.cnsiGuid, spaceGuid)
            .then(function (serviceInstances) {
              // Get any extra service data
              // and get the types from services
              return {
                filterTypes: that.getServiceFilterTypes(serviceInstances),
                services: that.getExtraServiceData(serviceInstances)
              };
            })
            .then(function (data) {
              // Attach data to controller
              that.filterTypes = data.filterTypes;
              that.services = data.services;
              that.ready = true;
            });
        }
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

    // Works out if the current list is being filtered or searched.
    that.isFiltered = function () {
      return that.search.$ || that.filterType !== that.ALL_FILTER;
    };

    that.showInstance = function (serviceInstance) {
      var isOfType = !that.filterType ||
        that.filterType === that.ALL_FILTER ||
        that.filterType === getServiceInstanceType(serviceInstance);
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

    // Gets all of the types in the current list of instances
    that.getServiceFilterTypes = function (serviceInstances) {
      var baseFilters = [{
        label: 'app.app-info.app-tabs.services.types.all',
        value: that.ALL_FILTER,
        lower: that.ALL_FILTER.toLowerCase()
      }];

      var typeFilters = _.chain(serviceInstances)
        .flatMap(function (serviceInstance) {
          return getServiceInstanceType(serviceInstance);
        })
        .compact()
        .uniq()
        .map(function (type) {
          return {
            label: type,
            value: type,
            lower: type.toLowerCase()
          };
        })
        .sortBy('lower')
        .value();

      return baseFilters.concat(typeFilters);
    };
  }

})();
