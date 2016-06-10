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
   * @param {app.model.modelManager} modelManager - the Model management service
   */
  function AddServiceWorkflowController($q, modelManager, $uibModalInstance, context) {
    var that = this;
    this.$q = $q;
    this.$uibModalInstance = $uibModalInstance;
    this.serviceModel = modelManager.retrieve('cloud-foundry.model.service');
    this.spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    this.instanceModel = modelManager.retrieve('cloud-foundry.model.service-instance');
    this.bindingModel = modelManager.retrieve('cloud-foundry.model.service-binding');
    this.cnsiGuid = context.cnsiGuid;
    this.spaceGuid = context.app.summary.space_guid;
    this.service = context.service;
    this.app = context.app;
    this.confirm = context.confirm || false;
    this.createNew = true;
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

      this.createNew = true;
      this.userInput = {
        name: null,
        plan: null,
        existingServiceInstance: null
      };

      this.data = {
        workflow: {
          allowJump: false,
          allowBack: false,
          hideStepNavStack: true,
          btnText: {
            cancel: this.confirm ? gettext('Cancel') : gettext('Back to Services')
          },
          steps: [
            {
              templateUrl: this.path + 'instance.html',
              nextBtnText: gettext('Add Service Instance'),
              onNext: function () {
                that.addService().then(function () {
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
        workflow: this.data.workflow,
        servicePlans: [],
        servicePlanMap: {},
        instances: [],
        service: this.service,
        createNew: function (createNewInstance) {
          that.createNew = createNewInstance;
        },
        serviceInstance: null,
        servicePlan: null
      };

      this.serviceModel.allServicePlans(this.cnsiGuid, this.service.metadata.guid)
        .then(function (servicePlans) {
          var plans = _.map(servicePlans, function (o) { return { label: o.entity.name, value: o }; });
          that.options.servicePlans.length = 0;
          [].push.apply(that.options.servicePlans, plans);

          that.options.servicePlanMap = _.keyBy(servicePlans,
                                                function (o) { return o.metadata.guid; });

          var planGuids = _.keys(that.options.servicePlanMap);
          if (planGuids.length > 0) {
            var q = 'service_plan_guid IN ' + planGuids.join(',');

            that.spaceModel.listAllServiceInstancesForSpace(that.cnsiGuid, that.spaceGuid, { q: q })
              .then(function (serviceInstances) {
                var instances = _.sortBy(serviceInstances, function (o) { return o.entity.name; });
                that.options.instances.length = 0;
                [].push.apply(that.options.instances, instances);
              });
          }
        });
    },

    addService: function () {
      var that = this;
      var deferred = this.$q.defer();

      if (this.createNew) {
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
      var bindingSpec = {
        service_instance_guid: this.options.serviceInstance.metadata.guid,
        app_guid: this.app.summary.guid
      };

      return this.bindingModel.createServiceBinding(this.cnsiGuid, bindingSpec);
    },

    stopWorkflow: function () {
      this.$uibModalInstance.dismiss('cancel');
    },

    finishWorkflow: function () {
      var that = this;
      if (!this.confirm) {
        this.addService().then(function () {
          that.addBinding();
          that.$uibModalInstance.dismiss('finish');
        });
      } else {
        this.$uibModalInstance.dismiss('finish');
      }
    }
  });

})();
