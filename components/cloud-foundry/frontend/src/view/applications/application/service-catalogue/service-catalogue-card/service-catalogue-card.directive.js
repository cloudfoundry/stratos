(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.service-catalogue')
    .directive('serviceCatalogueCard', serviceCatalogueCard);

  /**
   * @memberof cloud-foundry.view.applications.application.services
   * @name serviceCatalogueCard
   * @description The service card directive
   * @returns {object} The service card directive definition object
   */
  function serviceCatalogueCard() {
    return {
      bindToController: {
        app: '=',
        cnsiGuid: '=',
        service: '=',
        addOnly: '=?'
      },
      controller: ServiceCatalogueCardController,
      controllerAs: 'serviceCatalogueCardCtrl',
      restrict: 'E',
      scope: {},
      templateUrl: 'plugins/cloud-foundry/view/applications/application/service-catalogue/service-catalogue-card/service-catalogue-card.html'
    };
  }

  /**
   * @memberof cloud-foundry.view.applications.application.services.serviceCatalogueCard
   * @name serviceCatalogueCardController
   * @description Controller for service card directive
   * @constructor
   * @param {object} $scope - the Angular $scope service
   * @param {app.model.modelManager} modelManager - the application model manager
   * @param {app.utils.appEventService} appEventService - the event management service
   * @property {app.utils.appEventService} appEventService - the event management service
   * @property {object} cfServiceInstanceService - the service instance service
   * @property {cloud-foundry.model.service-binding} bindingModel - the Cloud Foundry service binding model
   * @property {boolean} allowAddOnly - allow adding services only (no manage or detach)
   * @property {array} serviceBindings - the service instances bound to specified app
   * @property {number} numAttached - the number of service instances bound to specified app
   * @property {array} actions - the actions that can be performed from vm.service card
   */
  function ServiceCatalogueCardController($scope, modelManager, appEventService) {
    var vm = this;

    var bindingModel = modelManager.retrieve('cloud-foundry.model.service-binding');
    var authModel = modelManager.retrieve('cloud-foundry.model.auth');

    vm.allowAddOnly = angular.isDefined(vm.addOnly) ? vm.addOnly : false;
    vm.numAttached = 0;
    vm.serviceBindings = [];

    $scope.$watch(function () {
      return vm.app.summary.services;
    }, function () {
      init();
    });

    $scope.$watch(function () {
      return vm.service;
    }, function () {
      vm.canBind = vm.service._bindTarget === 'APP';
    });

    vm.addService = addService;
    vm.hideServiceActions = hideServiceActions;
    vm.getServiceInstanceGuids = getServiceInstanceGuids;
    vm.getServiceBindings = getServiceBindings;
    vm.init = init;

    /**
     * @function init
     * @memberof cloud-foundry.view.applications.application.services.serviceCatalogueCard.serviceCatalogueCardController
     * @description Fetch service bindings for this app and update content
     * @returns {undefined}
     */
    function init() {
      var serviceInstances = vm.getServiceInstanceGuids();
      if (serviceInstances.length > 0) {
        return vm.getServiceBindings(serviceInstances);
      } else {
        vm.serviceBindings = [];
      }
    }

    /**
     * @function getServiceInstanceGuids
     * @memberof cloud-foundry.view.applications.application.services.serviceCatalogueCard.serviceCatalogueCardController
     * @description Get service instances for app
     * @returns {array} A list of service instance GUIDs
     */
    function getServiceInstanceGuids() {
      var serviceInstances = _.chain(vm.app.summary.services)
        .filter(function (o) {
          return angular.isDefined(o.service_plan) &&
            o.service_plan.service.guid === vm.service.metadata.guid;
        })
        .map('guid')
        .value();
      return serviceInstances;
    }

    /**
     * @function getServiceBindings
     * @memberof cloud-foundry.view.applications.application.services.serviceCatalogueCard.serviceCatalogueCardController
     * @description Get service bindings for specified service instances
     * @param {array} serviceInstanceGuids A list of service instance GUIDs
     * @returns {promise} A promise object
     */
    function getServiceBindings(serviceInstanceGuids) {
      var q = 'service_instance_guid IN ' + serviceInstanceGuids.join(',');
      var options = {q: q, 'inline-relations-depth': 1, 'include-relations': 'service_instance'};
      return bindingModel.listAllServiceBindings(vm.cnsiGuid, options)
        .then(function (bindings) {
          var appGuid = vm.app.summary.guid;
          var appBindings = _.filter(bindings, function (o) {
            return o.entity.app_guid === appGuid;
          });
          vm.serviceBindings = appBindings;
        });
    }

    /**
     * @function addService
     * @memberof cloud-foundry.view.applications.application.services.serviceCatalogueCard.serviceCatalogueCardController
     * @description Show the add service detail view
     * @returns {undefined}
     */
    function addService() {
      var config = {
        app: vm.app,
        cnsiGuid: vm.cnsiGuid,
        confirm: !vm.allowAddOnly,
        service: vm.service
      };

      appEventService.$emit('cf.events.START_ADD_SERVICE_WORKFLOW', config);
    }

    /**
     * @function hideServiceActions
     * @memberof cloud-foundry.view.applications.application.services.serviceCatalogueCard.serviceCatalogueCardController
     * @description Update service actions visibility
     * @returns {*}
     */
    function hideServiceActions() {
      return !authModel.isAllowed(vm.cnsiGuid,
        authModel.resources.managed_service_instance,
        authModel.actions.create, vm.app.summary.space_guid);
    }
  }

})();
