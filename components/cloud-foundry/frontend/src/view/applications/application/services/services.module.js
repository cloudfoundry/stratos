(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.services', [])
    .config(registerRoute)
    .run(registerAppTab);

  function registerRoute($stateProvider) {
    $stateProvider.state('cf.applications.application.services', {
      url: '/services',
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
  function ApplicationServicesController($scope, modelManager, $stateParams) {
    var that = this;
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
      if (angular.isDefined(spaceGuid)) {
        that.model.listAllServicesForSpace(that.cnsiGuid, spaceGuid)
          .then(function (services) {
            // retrieve categories and attachment data for service filtering
            var categories = [];
            var attachedServices = _.chain(summary.services)
                                    .filter(function (o) { return angular.isDefined(o.service_plan); })
                                    .map(function (o) { return o.service_plan.service.guid; })
                                    .value();
            angular.forEach(services, function (service) {
              if (attachedServices.length > 0) {
                if (_.includes(attachedServices, service.metadata.guid)) {
                  service.attached = true;
                }
              }

              // Parse service entity extra data JSON string
              if (!_.isNil(service.entity.extra) && angular.isString(service.entity.extra)) {
                service.entity.extra = angular.fromJson(service.entity.extra);
              }

              // a service can belong to >1 category, so allow filtering by any of them
              if (angular.isObject(service.entity.extra) && angular.isDefined(service.entity.extra.Categories)) {
                var _categories = service.entity.extra.Categories;
                if (angular.isString(_categories)) {
                  _categories = [_categories];
                }
                var serviceCategories = _.map(_categories, function (o) {
                  return {
                    label: o,
                    value: { Categories: o },
                    lower: o.toLowerCase()
                  };
                });
                categories = _.unionBy(categories, serviceCategories, 'lower');
              }
            });

            that.services.length = 0;
            [].push.apply(that.services, services);

            categories = _.sortBy(categories, 'lower');
            that.serviceCategories.length = 2;
            [].push.apply(that.serviceCategories, categories);
          })
          .finally(function () {
            that.ready = true;
          });
      }
    });

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
