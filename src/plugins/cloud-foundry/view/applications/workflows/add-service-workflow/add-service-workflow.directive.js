(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications')
    .directive('addServiceWorkflow', addServiceWorkflow);

  addServiceWorkflow.$inject = [];

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

  AddServiceWorkflowController.$inject = [
    '$q',
    '$scope',
    'app.model.modelManager',
    'app.event.eventService',
    'helion.framework.widgets.detailView'
  ];

  /**
   * @memberof cloud-foundry.view.applications
   * @name AddServiceWorkflowController
   * @constructor
   * @param {object} $q - the Angular $q service
   * @param {object} $scope - the Angular $scope service
   * @param {app.model.modelManager} modelManager - the application model manager
   * @param {app.event.eventService} eventService - the event management service
   * @param {helion.framework.widgets.detailView} detailView - the detail view widget
   * @property {object} $q - the Angular $q service
   * @property {helion.framework.widgets.detailView} detailView - the detail view widget
   * @property {cloud-foundry.model.application} appModel - the CF application model
   * @property {cloud-foundry.model.service-binding} bindingModel - the CF service binding model
   * @property {cloud-foundry.model.service-instance} instanceModel - the CF service instance model
   * @property {cloud-foundry.model.service} serviceModel - the CF service model
   * @property {cloud-foundry.model.space} spaceModel - the CF space model
   * @property {object} modal - the detail view modal instance
   * @property {string} path - the path to this add-service-workflow folder
   * @property {object} addServiceActions - the stop and finish workflow actions
   */
  function AddServiceWorkflowController($q, $scope, modelManager, eventService, detailView) {
    var that = this;
    this.$q = $q;
    this.detailView = detailView;
    this.appModel = modelManager.retrieve('cloud-foundry.model.application');
    this.bindingModel = modelManager.retrieve('cloud-foundry.model.service-binding');
    this.instanceModel = modelManager.retrieve('cloud-foundry.model.service-instance');
    this.serviceModel = modelManager.retrieve('cloud-foundry.model.service');
    this.spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    this.modal = null;

    this.path = 'plugins/cloud-foundry/view/applications/workflows/add-service-workflow/';
    this.addServiceActions = {
      stop: function () {
        that.stopWorkflow();
      },

      finish: function () {
        that.finishWorkflow();
      }
    };

    var startWorkflowEvent = eventService.$on('cf.events.START_ADD_SERVICE_WORKFLOW', function (event, config) {
      that.reset(config).then(function () {
        that.modal = that.startWorkflow();
      });
    });
    $scope.$on('$destroy', startWorkflowEvent);
  }

  angular.extend(AddServiceWorkflowController.prototype, {
    /**
     * @function reset
     * @memberof cloud-foundry.view.applications.AddServiceWorkflowController
     * @description Reset the workflow to an initial state
     * @param {object} config - data containing app, service, etc.
     * @returns {promise} A promise object
     */
    reset: function (config) {
      var that = this;

      // Parse service entity extra data JSON string
      if (!_.isNil(config.service.entity.extra) && angular.isString(config.service.entity.extra)) {
        config.service.entity.extra = angular.fromJson(config.service.entity.extra);
      }

      this.data = {
        app: config.app,
        service: config.service,
        confirm: config.confirm,
        cnsiGuid: config.cnsiGuid,
        spaceGuid: config.app.summary.space_guid
      };
      this.errors = {};

      this.userInput = {
        name: null,
        plan: null,
        existingServiceInstance: null
      };

      this.data.workflow = {
        allowJump: false,
        allowBack: false,
        allowCancelAtLastStep: false,
        hideStepNavStack: true,
        btnText: {
          cancel: config.confirm ? gettext('Cancel') : gettext('Back to Services')
        },
        steps: [
          {
            templateUrl: this.path + 'instance.html',
            formName: 'addInstanceForm',
            nextBtnText: gettext('Add Service Instance'),
            onNext: function () {
              return that.addService().then(function () {
                that.addBinding();
              });
            }
          }
        ]
      };

      if (config.confirm) {
        var confirmStep = {
          templateUrl: this.path + 'acknowledge.html',
          nextBtnText: gettext('Done'),
          isLastStep: true
        };
        this.data.workflow.steps.push(confirmStep);
        this.data.workflow.allowCancelAtLastStep = false;
      } else {
        delete this.data.workflow.steps[0].onNext;
        this.data.workflow.steps[0].isLastStep = true;
        this.data.workflow.allowCancelAtLastStep = true;
      }

      this.options = {
        errors: this.errors,
        userInput: this.userInput,
        service: this.data.service,
        workflow: this.data.workflow,

        instances: [],
        instanceNames: [],
        servicePlans: [],
        servicePlanMap: {},

        isCreateNew: true,
        createNew: function (createNewInstance) {
          that.options.isCreateNew = createNewInstance;
        },

        serviceInstance: null,
        servicePlan: null
      };

      return this.getServicePlans(config.service.metadata.guid)
        .then(function () {
          var boundInstances = _.keyBy(config.app.summary.services, 'guid');
          var servicePlanGuids = _.keys(that.options.servicePlanMap);

          if (servicePlanGuids.length > 0) {
            return that.getServiceInstances(servicePlanGuids, boundInstances);
          }
        });
    },

    /**
     * @function getServicePlans
     * @memberof cloud-foundry.view.applications.AddServiceWorkflowController
     * @description Retrieve service plans for this service
     * @param {string} serviceGuid - the service GUID to get plans for
     * @returns {promise} A promise object
     * @private
     */
    getServicePlans: function (serviceGuid) {
      var that = this;
      this.options.servicePlans.length = 0;
      this.options.servicePlanMap = {};

      return this.serviceModel.allServicePlans(this.data.cnsiGuid, serviceGuid)
        .then(function (servicePlans) {
          var plans = _.map(servicePlans, function (o) { return { label: o.entity.name, value: o }; });
          [].push.apply(that.options.servicePlans, plans);

          that.options.servicePlanMap = _.keyBy(servicePlans,
                                                function (o) { return o.metadata.guid; });
        });
    },

    /**
     * @function getServiceInstances
     * @memberof cloud-foundry.view.applications.AddServiceWorkflowController
     * @description Retrieve service instances for this service
     * @param {array} servicePlanGuids - service plan GUIDs to get bindings for
     * @param {object} boundInstances - already bound service instances
     * @returns {promise} A promise object
     * @private
     */
    getServiceInstances: function (servicePlanGuids, boundInstances) {
      var that = this;
      this.options.instances.length = 0;
      this.options.instanceNames.length = 0;

      var q = 'service_plan_guid IN ' + servicePlanGuids.join(',');
      var params = { q: q, 'inline-relations-depth': 2 };
      return this.spaceModel.listAllServiceInstancesForSpace(this.data.cnsiGuid, this.data.spaceGuid, params)
        .then(function (serviceInstances) {
          var instances = _.sortBy(serviceInstances, function (o) { return o.entity.name; });
          var instanceNames = _.map(instances, function (o) { return o.entity.name; });
          [].push.apply(that.options.instanceNames, instanceNames);

          instances = _.filter(instances, function (o) { return !boundInstances[o.metadata.guid]; });
          [].push.apply(that.options.instances, instances);
        });
    },

    /**
     * @function addService
     * @memberof cloud-foundry.view.applications.AddServiceWorkflowController
     * @description Add a new service instance to the space
     * @returns {promise} A promise object
     */
    addService: function () {
      var that = this;
      var deferred = this.$q.defer();

      if (this.options.isCreateNew) {
        var newInstance = {
          name: this.options.userInput.name,
          service_plan_guid: this.options.userInput.plan.metadata.guid,
          space_guid: this.data.spaceGuid
        };
        this.instanceModel.createServiceInstance(this.data.cnsiGuid, newInstance)
          .then(function (newServiceInstance) {
            if (angular.isDefined(newServiceInstance.metadata)) {
              that.options.serviceInstance = newServiceInstance;
              deferred.resolve();
            } else {
              deferred.reject();
            }
          });
        this.options.servicePlan = this.options.userInput.plan;
      } else {
        var planGuid = this.options.userInput.existingServiceInstance.entity.service_plan_guid;
        this.options.servicePlan = this.options.servicePlanMap[planGuid];
        this.options.serviceInstance = this.options.userInput.existingServiceInstance;
        deferred.resolve();
      }

      return deferred.promise;
    },

    /**
     * @function addBinding
     * @memberof cloud-foundry.view.applications.AddServiceWorkflowController
     * @description Add a new service binding to the application
     * @returns {promise} A promise object
     */
    addBinding: function () {
      var that = this;
      var bindingSpec = {
        service_instance_guid: this.options.serviceInstance.metadata.guid,
        app_guid: this.data.app.summary.guid
      };

      return this.bindingModel.createServiceBinding(this.data.cnsiGuid, bindingSpec)
        .then(function (newBinding) {
          if (angular.isDefined(newBinding.metadata)) {
            that.appModel.getAppSummary(that.data.cnsiGuid, that.data.app.summary.guid);
          }
        });
    },

    /**
     * @function startWorkflow
     * @memberof cloud-foundry.view.applications.AddServiceWorkflowController
     * @description Show the add service detail view
     * @returns {promise} A promise object
     */
    startWorkflow: function () {
      var config = {
        templateUrl: 'plugins/cloud-foundry/view/applications/workflows/add-service-workflow/add-service-workflow.html',
        title: gettext('Add Service to ') + this.data.app.summary.name
      };
      var context = {
        addServiceActions: this.addServiceActions,
        options: this.options
      };

      return this.detailView(config, context);
    },

    /**
     * @function stopWorkflow
     * @memberof cloud-foundry.view.applications.AddServiceWorkflowController
     * @description Stop the workflow and dismiss view
     * @returns {void}
     */
    stopWorkflow: function () {
      this.modal.close();
    },

    /**
     * @function finishWorkflow
     * @memberof cloud-foundry.view.applications.AddServiceWorkflowController
     * @description Finish the workflow and close view
     * @returns {void}
     */
    finishWorkflow: function () {
      var that = this;
      if (!this.data.confirm) {
        this.addService().then(function () {
          that.addBinding().then(function () {
            that.modal.close();
          });
        });
      } else {
        this.modal.close();
      }
    }
  });

})();
