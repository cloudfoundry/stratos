(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.services', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cf.applications.application.services', {
      url: '/services',
      templateUrl: 'plugins/cloud-foundry/view/applications/application/services/services.html',
      controller: ApplicationServicesController,
      controllerAs: 'applicationServicesCtrl'
    });
  }

  ApplicationServicesController.$inject = [
    '$scope',
    'app.model.modelManager',
    'app.event.eventService',
    '$stateParams'
  ];

  /**
   * @name ApplicationServicesController
   * @constructor
   * @param {object} $scope - the Angular $scope service
   * @param {app.model.modelManager} modelManager - the model management service
   * @param {app.event.eventService} eventService - the event bus service
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
  function ApplicationServicesController($scope, modelManager, eventService, $stateParams) {
    var that = this;
    this.model = modelManager.retrieve('cloud-foundry.model.space');
    this.appModel = modelManager.retrieve('cloud-foundry.model.application');
    this.id = $stateParams.guid;
    this.cnsiGuid = $stateParams.cnsiGuid;
    this.services = [];
    this.serviceCategories = [
      { label: gettext('Attached Service Instances'), value: 'attached' },
      { label: gettext('All Services'), value: 'all' }
    ];
    this.searchCategory = 'all';
    this.search = {};
    this.category = {
      entity: {
        extra: undefined
      }
    };

    $scope.$watch(function () {
      return that.appModel.application.summary;
    }, function (summary) {
      var spaceGuid = summary.space_guid;
      if (angular.isDefined(spaceGuid)) {
        that.model.listAllServicesForSpace(that.cnsiGuid, spaceGuid)
          .then(function (services) {
            // retrieve categories and attachment data for service filtering
            var categories = [];
            var attachedServices = _.chain(summary.services)
                                    .filter(function () { return angular.isDefined(o.service_plan); })
                                    .map(function (o) { return o.service_plan.service.guid; });
            angular.forEach(services, function (service) {
              if (attachedServices.length > 0) {
                if (_.includes(attachedServices, service.metadata.guid)) {
                  service.attached = true;
                }
              }

              // a service can belong to >1 category, so allow filtering by any of them
              if (angular.isObject(service.entity.extra) && angular.isDefined(service.entity.extra.categories)) {
                var serviceCategories = _.map(service.entity.extra.categories,
                                              function (o) {return { label: o, value: { categories: o }, lower: o.toLowerCase() }; });
                categories = _.unionBy(categories, serviceCategories, 'lower');
              }
            });

            that.services.length = 0;
            [].push.apply(that.services, services);

            categories = _.sortBy(categories, 'lower');
            that.serviceCategories.length = 2;
            [].push.apply(that.serviceCategories, categories);
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

  angular.extend(ApplicationServicesController.prototype, {
  });

})();
