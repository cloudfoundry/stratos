(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications')
    .controller('addServiceWorkflowController', AddServiceWorkflowController);

  AddServiceWorkflowController.$inject = [
    '$q',
    'app.model.modelManager',
    '$uibModalInstance',
    'context'
  ];

  /**
   * @memberof cloud-foundry.view.applications
   * @name AddServiceWorkflowController
   * @constructor
   * @param {object} $q - the Angular $q service
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {$uibModalInstance} $uibModalInstance - the modal instance
   * @param {object} context - the detail view context/data
   */
  function AddServiceWorkflowController($q, modelManager, $uibModalInstance, context) {
    var that = this;
    this.$q = $q;
    this.$uibModalInstance = $uibModalInstance;
    this.appModel = modelManager.retrieve('cloud-foundry.model.application');
    this.serviceModel = modelManager.retrieve('cloud-foundry.model.service');
    this.spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    this.instanceModel = modelManager.retrieve('cloud-foundry.model.service-instance');
    this.bindingModel = modelManager.retrieve('cloud-foundry.model.service-binding');
    this.cnsiGuid = context.cnsiGuid;
    this.spaceGuid = context.app.summary.space_guid;
    this.service = context.service;
    this.app = context.app;
    this.confirm = context.confirm || false;
    this.path = 'plugins/cloud-foundry/view/applications/workflows/add-service-workflow/';

    this.addServiceActions = {
      stop: function () {
        that.stopWorkflow();
      },

      finish: function () {
        that.finishWorkflow();
      }
    };

    this.init();
  }

  angular.extend(AddServiceWorkflowController.prototype, {

    init: function () {
      var that = this;
      this.data = {};

      this.newBinding = null;
      this.userInput = {
        name: null,
        plan: null,
        existingServiceInstance: null
      };
      this.errors = {};

      this.data = {
        workflow: {
          allowJump: false,
          allowBack: false,
          allowCancelAtLastStep: true,
          hideStepNavStack: true,
          btnText: {
            cancel: this.confirm ? gettext('Cancel') : gettext('Back to Services')
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
        }
      };

      if (this.confirm) {
        var confirmStep = {
          templateUrl: this.path + 'acknowledge.html',
          nextBtnText: gettext('Done'),
          isLastStep: true
        };
        this.data.workflow.steps.push(confirmStep);
      } else {
        delete this.data.workflow.steps[0].onNext;
        this.data.workflow.steps[0].isLastStep = true;
      }

      this.options = {
        userInput: this.userInput,
        errors: this.errors,
        workflow: this.data.workflow,
        servicePlans: [],
        servicePlanMap: {},
        instances: [],
        instanceNames: [],
        service: this.service,
        isCreateNew: true,
        createNew: function (createNewInstance) {
          that.options.isCreateNew = createNewInstance;
        },
        serviceInstance: null,
        servicePlan: null
      };

      var boundInstances = _.keyBy(this.app.summary.services, 'guid');
      return this.serviceModel.allServicePlans(this.cnsiGuid, this.service.metadata.guid)
        .then(function (servicePlans) {
          var plans = _.map(servicePlans, function (o) { return { label: o.entity.name, value: o }; });
          that.options.servicePlans.length = 0;
          [].push.apply(that.options.servicePlans, plans);

          that.options.servicePlanMap = _.keyBy(servicePlans,
                                                function (o) { return o.metadata.guid; });

          var planGuids = _.keys(that.options.servicePlanMap);
          if (planGuids.length > 0) {
            var q = 'service_plan_guid IN ' + planGuids.join(',');

            that.spaceModel.listAllServiceInstancesForSpace(that.cnsiGuid, that.spaceGuid, { q: q, 'inline-relations-depth': 2 })
              .then(function (serviceInstances) {
                var instances = _.chain(serviceInstances)
                                 .filter(function (o) { return !boundInstances[o.metadata.guid]; })
                                 .sortBy(function (o) { return o.entity.name; })
                                 .value();
                that.options.instances.length = 0;
                [].push.apply(that.options.instances, instances);

                var instanceNames = _.map(instances, function (o) { return o.entity.name; });
                that.options.instanceNames.length = 0;
                [].push.apply(that.options.instanceNames, instanceNames);
              });
          }
        });
    },

    addService: function () {
      var that = this;
      var deferred = this.$q.defer();

      if (this.options.isCreateNew) {
        var newInstance = {
          name: this.options.userInput.name,
          service_plan_guid: this.options.userInput.plan.metadata.guid,
          space_guid: this.spaceGuid
        };
        this.instanceModel.createServiceInstance(this.cnsiGuid, newInstance)
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

    addBinding: function () {
      var that = this;
      var bindingSpec = {
        service_instance_guid: this.options.serviceInstance.metadata.guid,
        app_guid: this.app.summary.guid
      };

      return this.bindingModel.createServiceBinding(this.cnsiGuid, bindingSpec)
        .then(function (newBinding) {
          if (angular.isDefined(newBinding.metadata)) {
            that.appModel.getAppSummary(that.cnsiGuid, that.app.summary.guid);
            that.newBinding = newBinding;
          }
        });
    },

    stopWorkflow: function () {
      this.$uibModalInstance.dismiss('cancel');
    },

    finishWorkflow: function () {
      var that = this;
      if (!this.confirm) {
        return this.addService().then(function () {
          that.addBinding().then(function () {
            that.$uibModalInstance.close();
          });
        });
      } else {
        this.$uibModalInstance.close();
      }
    }
  });

})();
