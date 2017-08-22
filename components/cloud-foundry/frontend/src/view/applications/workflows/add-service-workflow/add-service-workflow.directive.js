(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications')
    .directive('addServiceWorkflow', addServiceWorkflow);

  /**
   * @memberof cloud-foundry.view.applications
   * @name addServiceWorkflow
   * @description An add service workflow detail view
   * @returns {object} The add-service-workflow directive definition object
   */
  function addServiceWorkflow() {
    return {
      controller: AddServiceWorkflowController,
      controllerAs: 'addServiceWorkflowCtrl',
      restrict: 'E'
    };
  }

  /**
   * @memberof cloud-foundry.view.applications
   * @name AddServiceWorkflowController
   * @constructor
   * @param {object} $q - the Angular $q service
   * @param {object} $scope - the Angular $scope service
   * @param {object} $translate - the Angular $translate service
   * @param {app.model.modelManager} modelManager - the application model manager
   * @param {app.utils.appEventService} appEventService - the event management service
   * @param {app.framework.widgets.frameworkDetailView} frameworkDetailView - the detail view widget
   * @property {object} modal - the detail view modal instance
   * @property {object} addServiceActions - the stop and finish workflow actions
   */
  function AddServiceWorkflowController($q, $scope, $translate, modelManager, appEventService, frameworkDetailView) {
    var vm = this;

    var appModel = modelManager.retrieve('cloud-foundry.model.application');
    var bindingModel = modelManager.retrieve('cloud-foundry.model.service-binding');
    var instanceModel = modelManager.retrieve('cloud-foundry.model.service-instance');
    var serviceModel = modelManager.retrieve('cloud-foundry.model.service');
    var spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    var path = 'plugins/cloud-foundry/view/applications/workflows/add-service-workflow/';

    vm.modal = null;
    vm.loadingServiceInstances = false;
    vm.addServiceActions = {
      stop: function () {
        vm.stopWorkflow();
      },

      finish: function () {
        vm.finishWorkflow();
      }
    };

    vm.reset = reset;
    vm.addService = addService;
    vm.addBinding = addBinding;
    vm.startWorkflow = startWorkflow;
    vm.stopWorkflow = stopWorkflow;
    vm.finishWorkflow = finishWorkflow;

    var startWorkflowEvent = appEventService.$on('cf.events.START_ADD_SERVICE_WORKFLOW', function (event, config) {
      vm.reset(config);
      vm.modal = vm.startWorkflow();
      _loadServiceInstances();
    });
    $scope.$on('$destroy', startWorkflowEvent);

    /**
     * @function reset
     * @memberof cloud-foundry.view.applications.AddServiceWorkflowController
     * @description Reset the workflow to an initial state
     * @param {object} config - data containing app, service, etc.
     * @returns {void}
     */
    function reset(config) {
      // Parse service entity extra data JSON string
      if (!_.isNil(config.service.entity.extra) && angular.isString(config.service.entity.extra)) {
        config.service.entity.extra = angular.fromJson(config.service.entity.extra);
      }

      vm.data = {
        app: config.app,
        service: config.service,
        confirm: config.confirm,
        cnsiGuid: config.cnsiGuid,
        spaceGuid: config.app.summary.space_guid
      };
      vm.errors = {};
      vm.spinners = {};

      vm.userInput = {
        name: null,
        plan: null,
        existingServiceInstance: null
      };

      vm.data.workflow = {
        allowJump: false,
        allowBack: false,
        allowCancelAtLastStep: false,
        hideStepNavStack: true,
        lastStepCommit: false,
        btnText: {
          cancel: config.confirm ? 'buttons.cancel' : 'app.app-info.app-tabs.services.add.back-to-services'
        },
        steps: [
          {
            templateUrl: path + 'instance.html',
            formName: 'addInstanceForm',
            nextBtnText: 'app.app-info.app-tabs.services.add.add',
            showBusyOnNext: true,
            stepCommit: true,
            onNext: function () {
              return vm.addService().then(function () {
                return vm.addBinding().then(function () {
                  return $q.resolve();
                }, function () {
                  return _onServiceBindingError();
                });
              }, function () {
                return $q.reject('app.app-info.app-tabs.services.add.notifications.failure-create');
              });
            }
          }
        ]
      };

      if (config.confirm) {
        var confirmStep = {
          templateUrl: path + 'acknowledge.html',
          nextBtnText: 'buttons.done',
          isLastStep: true
        };
        vm.data.workflow.steps.push(confirmStep);
        vm.data.workflow.allowCancelAtLastStep = false;
      } else {
        delete vm.data.workflow.steps[0].onNext;
        vm.data.workflow.steps[0].isLastStep = true;
        vm.data.workflow.allowCancelAtLastStep = true;
      }

      vm.options = {
        errors: vm.errors,
        spinners: vm.spinners,
        userInput: vm.userInput,
        service: vm.data.service,
        workflow: vm.data.workflow,
        activeTab: 0,

        instances: [],
        instanceNames: [],
        servicePlans: [],
        servicePlanMap: {},

        serviceInstance: null,
        servicePlan: null
      };
    }

    /**
     * @function _loadServiceInstances
     * @memberof cloud-foundry.view.applications.AddServiceWorkflowController
     * @description Retrieve service plans and existing service
     * instances for this service.
     * @returns {object} A promise object
     * @private
     */
    function _loadServiceInstances() {
      vm.spinners.loadingServiceInstances = true;
      return _getServicePlans(vm.data.service.metadata.guid)
        .then(function () {
          var boundInstances = _.keyBy(vm.data.app.summary.services, 'guid');
          var servicePlanGuids = _.keys(vm.options.servicePlanMap);

          if (servicePlanGuids.length > 0) {
            return _getServiceInstances(servicePlanGuids, boundInstances);
          }
        })
        .finally(function () {
          vm.spinners.loadingServiceInstances = false;
        });
    }

    /**
     * @function _getServicePlans
     * @memberof cloud-foundry.view.applications.AddServiceWorkflowController
     * @description Retrieve service plans for this service
     * @param {string} serviceGuid - the service GUID to get plans for
     * @returns {object} A promise object
     * @private
     */
    function _getServicePlans(serviceGuid) {
      vm.options.servicePlans.length = 0;
      vm.options.servicePlanMap = {};

      return serviceModel.allServicePlans(vm.data.cnsiGuid, serviceGuid)
        .then(function (servicePlans) {
          var plans = _.map(servicePlans, function (o) { return { label: o.entity.name, value: o }; });
          [].push.apply(vm.options.servicePlans, plans);

          if (vm.options.servicePlans.length) {
            vm.options.userInput.plan = vm.options.servicePlans[0].value;
          }

          vm.options.servicePlanMap = _.keyBy(servicePlans, function (o) { return o.metadata.guid; });
        });
    }

    /**
     * @function _getServiceInstances
     * @memberof cloud-foundry.view.applications.AddServiceWorkflowController
     * @description Retrieve service instances for this service
     * @param {array} servicePlanGuids - service plan GUIDs to get bindings for
     * @param {object} boundInstances - already bound service instances
     * @returns {object} A promise object
     * @private
     */
    function _getServiceInstances(servicePlanGuids, boundInstances) {
      vm.options.instances.length = 0;
      vm.options.instanceNames.length = 0;

      var q = 'service_plan_guid IN ' + servicePlanGuids.join(',');
      var params = { q: q };
      return spaceModel.listAllServiceInstancesForSpace(vm.data.cnsiGuid, vm.data.spaceGuid, params)
        .then(function (serviceInstances) {
          var instances = _.sortBy(serviceInstances, function (o) { return o.entity.name; });
          var instanceNames = _.map(instances, function (o) { return o.entity.name; });
          [].push.apply(vm.options.instanceNames, instanceNames);

          instances = _.filter(instances, function (o) { return !boundInstances[o.metadata.guid]; });
          [].push.apply(vm.options.instances, instances);
        });
    }

    /**
     * @function addService
     * @memberof cloud-foundry.view.applications.AddServiceWorkflowController
     * @description Add a new service instance to the space
     * @returns {object} A promise object
     */
    function addService() {
      var deferred = $q.defer();

      if (vm.options.activeTab === 0) {
        var newInstance = {
          name: vm.options.userInput.name,
          service_plan_guid: vm.options.userInput.plan.metadata.guid,
          space_guid: vm.data.spaceGuid
        };
        instanceModel.createServiceInstance(vm.data.cnsiGuid, newInstance)
          .then(function (newServiceInstance) {
            if (angular.isDefined(newServiceInstance.metadata)) {
              vm.options.serviceInstance = newServiceInstance;
              deferred.resolve();
            } else {
              deferred.reject();
            }
          }, function () {
            deferred.reject();
          });
        vm.options.servicePlan = vm.options.userInput.plan;
      } else {
        var planGuid = vm.options.userInput.existingServiceInstance.entity.service_plan_guid;
        vm.options.servicePlan = vm.options.servicePlanMap[planGuid];
        vm.options.serviceInstance = vm.options.userInput.existingServiceInstance;
        deferred.resolve();
      }

      return deferred.promise;
    }

    /**
     * @function addBinding
     * @memberof cloud-foundry.view.applications.AddServiceWorkflowController
     * @description Add a new service binding to the application
     * @returns {object} A promise object
     */
    function addBinding() {
      var bindingSpec = {
        service_instance_guid: vm.options.serviceInstance.metadata.guid,
        app_guid: vm.data.app.summary.guid
      };

      return bindingModel.createServiceBinding(vm.data.cnsiGuid, bindingSpec)
        .then(function (newBinding) {
          if (angular.isDefined(newBinding.metadata)) {
            appModel.getAppSummary(vm.data.cnsiGuid, vm.data.app.summary.guid);
          }
        }, function () {
          return $q.reject();
        });
    }

    /**
     * @function startWorkflow
     * @memberof cloud-foundry.view.applications.AddServiceWorkflowController
     * @description Show the add service detail view
     * @returns {object} A promise object
     */
    function startWorkflow() {
      var config = {
        templateUrl: 'plugins/cloud-foundry/view/applications/workflows/add-service-workflow/add-service-workflow.html',
        title: 'app.app-info.app-tabs.services.add.title',
        titleTranslateValues: { appName: vm.data.app.summary.name },
        dialog: true,
        class: 'dialog-form-larger'
      };
      var context = {
        addServiceActions: vm.addServiceActions,
        options: vm.options
      };

      return frameworkDetailView(config, context);
    }

    /**
     * @function stopWorkflow
     * @memberof cloud-foundry.view.applications.AddServiceWorkflowController
     * @description Stop the workflow and dismiss view
     * @returns {void}
     */
    function stopWorkflow() {
      vm.modal.close();
    }

    /**
     * @function finishWorkflow
     * @memberof cloud-foundry.view.applications.AddServiceWorkflowController
     * @description Finish the workflow and close view
     * @returns {void}
     */
    function finishWorkflow() {
      if (!vm.data.confirm) {
        vm.addService().then(function () {
          vm.addBinding().then(function () {
            // show notification for successful binding
            var successMsg = $translate.instant('app.app-info.app-tabs.services.add.notifications.success', {
              service: vm.options.serviceInstance.entity.name,
              appName: vm.data.app.summary.name
            });
            appEventService.$emit('events.NOTIFY_SUCCESS', {message: successMsg});
            vm.modal.close();
          }, function () {
            return _onServiceBindingError();
          });
        }, function () {
          return $q.reject('app.app-info.app-tabs.services.add.notifications.failure-create');
        });
      } else {
        vm.modal.close();
      }
    }

    /**
     * @function _onServiceBindingError
     * @memberof cloud-foundry.view.applications.AddServiceWorkflowController
     * @description Error handler for binding service instance
     * @returns {object} A promise object
     * @private
     */
    function _onServiceBindingError() {
      if (vm.options.activeTab === 0) {
        _loadServiceInstances().then(function () {
          vm.options.activeTab = 1;
          var guid = vm.options.serviceInstance.metadata.guid;
          vm.userInput.existingServiceInstance = _.find(vm.options.instances,
                                                          function (o) { return o.metadata.guid === guid; });
        });
      }
      return $q.reject('app.app-info.app-tabs.services.add.notifications.failure-bind');
    }
  }

})();
