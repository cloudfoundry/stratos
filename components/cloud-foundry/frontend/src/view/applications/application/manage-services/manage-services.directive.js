(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications')
    .directive('manageServices', manageServices);

  /**
   * @memberof cloud-foundry.view.applications
   * @name manageServices
   * @description An manage services detail view
   * @returns {object} The manage-services directive definition object
   */
  function manageServices() {
    return {
      controller: ManageServicesController,
      controllerAs: 'manageServicesCtrl',
      restrict: 'E'
    };
  }

  /**
   * @memberof cloud-foundry.view.applications
   * @name ManageServicesController
   * @constructor
   * @param {object} $q - the Angular $q service
   * @param {object} $scope - the Angular $scope service
   * @param {app.model.modelManager} modelManager - the model management service
   * @param {app.utils.appEventService} appEventService - the event management service
   * @param {app.framework.widgets.frameworkDetailView} frameworkDetailView - the detail view service
   * @param {object} cfServiceInstanceService - the service instance service
   * @property {object} $q - the Angular $q service
   * @property {frameworkDetailView} frameworkDetailView - the detail view service
   * @property {object} cfServiceInstanceService - the service instance service
   * @property {cloud-foundry.model.application} appModel - the CF application model
   * @property {object} modal - the detail view modal instance
   * @property {array} serviceInstances - service instances associated with this service
   * @property {object} serviceBindings - service bindings associated with this app
   */
  function ManageServicesController($q, $scope, modelManager, appEventService, frameworkDetailView, cfServiceInstanceService) {
    var vm = this;

    var appModel = modelManager.retrieve('cloud-foundry.model.application');
    var modal = null;

    vm.serviceInstances = [];
    vm.serviceBindings = {};

    vm.detach = detach;
    vm.viewEnvVariables = viewEnvVariables;
    vm.reset = reset;
    vm.startManageServices = startManageServices;
    vm.getServiceBindings = getServiceBindings;

    var manageServicesEvent = appEventService.$on('cf.events.START_MANAGE_SERVICES', function (event, config) {
      $q.when(vm.reset(config)).then(function () {
        modal = vm.startManageServices();
      });
    });
    $scope.$on('$destroy', manageServicesEvent);

    /**
     * @function reset
     * @memberof cloud-foundry.view.applications.ManageServicesController
     * @description Reset the view to an initial state
     * @param {object} config - data containing app, service, etc.
     * @returns {promise} A promise object
     */
    function reset(config) {
      vm.data = {
        app: config.app,
        service: config.service,
        cnsiGuid: config.cnsiGuid
      };
      vm.serviceInstances.length = 0;
      vm.serviceBindings = {};

      var serviceInstances = _.filter(vm.data.app.summary.services, function (o) {
        return angular.isDefined(o.service_plan) &&
          o.service_plan.service.guid === vm.data.service.metadata.guid;
      });
      if (serviceInstances.length > 0) {
        [].push.apply(vm.serviceInstances, serviceInstances);

        var guids = _.map(vm.serviceInstances, 'guid');
        return vm.getServiceBindings(guids);
      }
    }

    /**
     * @function getServiceBindings
     * @memberof cloud-foundry.view.applications.ManageServicesController
     * @description Retrieve service bindings for service instances
     * @param {array} serviceInstanceGuids - a list of service instance GUIDs
     * @returns {promise} A promise object
     */
    function getServiceBindings(serviceInstanceGuids) {

      var q = 'service_instance_guid IN ' + serviceInstanceGuids.join(',');
      return appModel.listServiceBindings(vm.data.cnsiGuid, vm.data.app.summary.guid, {q: q})
        .then(function (bindings) {
          vm.serviceBindings = _.keyBy(bindings, function (o) {
            return o.entity.service_instance_guid;
          });
        });
    }

    /**
     * @function detach
     * @memberof cloud-foundry.view.applications.ManageServicesController
     * @description Detach service instance
     * @param {object} instance - the service instance to detach
     * @returns {promise} A promise object
     */
    function detach(instance) {

      var binding = vm.serviceBindings[instance.guid];
      return cfServiceInstanceService.unbindServiceFromApp(
        vm.data.cnsiGuid,
        vm.data.app.summary.guid,
        binding.metadata.guid,
        instance.name,
        function closeOnEmpty() {
          _.pull(vm.serviceInstances, instance);
          if (vm.serviceInstances.length === 0) {
            modal.dismiss('close');
          }
        }
      );
    }

    /**
     * @function viewEnvVariables
     * @memberof cloud-foundry.view.applications.ManageServicesController
     * @description View environmental variables of service instance
     * @param {object} instance - the service instance to view
     * @returns {promise} A promise object
     */
    function viewEnvVariables(instance) {
      return cfServiceInstanceService.viewEnvVariables(
        vm.data.cnsiGuid,
        vm.data.app.summary,
        vm.data.service.entity.label,
        instance
      );
    }

    /**
     * @function startManageService
     * @memberof cloud-foundry.view.applications.ManageServicesController
     * @description Show the manage services detail view
     * @returns {promise} A promise object
     */
    function startManageServices() {
      var config = {
        templateUrl: 'plugins/cloud-foundry/view/applications/application/manage-services/manage-services.html',
        title: 'app.app-info.app-tabs.services.manage.title',
        dialog: true,
        class: 'dialog-form-larger'
      };

      return frameworkDetailView(config, vm);
    }
  }

})();
