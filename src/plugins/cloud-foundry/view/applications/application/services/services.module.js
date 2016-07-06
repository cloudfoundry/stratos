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
   * @property {object} model - the Cloud Foundry applications model
   * @property {string} id - the application GUID
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
    this.search = {
      entity: {}
    };

    $scope.$watch(function () {
      return that.appModel.application.summary;
    }, function (summary) {
      var spaceGuid = summary.space_guid;
      if (angular.isDefined(spaceGuid)) {
        that.model.listAllServicesForSpace(that.cnsiGuid, spaceGuid)
          .then(function (services) {
            var attachedServices = _.map(summary.services, function (o) { return o.service_plan.service.guid; });
            if (attachedServices.length > 0) {
              angular.forEach(services, function (service) {
                if (_.includes(attachedServices, service.metadata.guid)) {
                  service.attached = true;
                }
              });
            }

            that.services.length = 0;
            [].push.apply(that.services, services);

            var categories = _.map(services, function (o) { return { label: o.entity.label, value: o.entity.label }; });
            that.serviceCategories.length = 2;
            [].push.apply(that.serviceCategories, categories);
          });
      }
    });

    $scope.$watch(function () {
      return that.searchCategory;
    }, function (newSearchCategory) {
      if (newSearchCategory === 'attached') {
        delete that.search.entity.label;
        that.search.attached = true;
      } else {
        delete that.search.attached;
        that.search.entity.label = newSearchCategory === 'all' ? '' : newSearchCategory;
      }
    });
  }

  angular.extend(ApplicationServicesController.prototype, {
  });

})();
