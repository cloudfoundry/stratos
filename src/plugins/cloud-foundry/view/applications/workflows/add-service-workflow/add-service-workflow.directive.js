(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications')
    .directive('addServiceWorkflow', addServiceWorkflow);

  addServiceWorkflow.$inject = [];

  /**
   * @namespace cloud-foundry.view.applications.addServiceWorkflow
   * @memberof cloud-foundry.view.applications
   * @name addServiceWorkflow
   * @description An add-service-workflow directive
   * @returns {object} The add-service-workflow directive definition object
   */
  function addServiceWorkflow() {
    return {
      templateUrl: 'plugins/cloud-foundry/view/applications/workflows/add-service-workflow/add-service-workflow.html',
      controller: AddServiceWorkflowController,
      controllerAs: 'addServiceWorkflowCtrl'
    };
  }

  AddServiceWorkflowController.$inject = [
    'app.model.modelManager',
    'app.event.eventService'
  ];

  /**
   * @namespace cloud-foundry.view.applications.addServiceWorkflowController
   * @memberof cloud-foundry.view.applications
   * @name addServiceWorkflowController
   * @constructor
   * @param {app.model.modelManager} modelManager - the Model management service
   * @property {data} data - a data bag
   */
  function AddServiceWorkflowController(modelManager, eventService) {
    var that = this;

    this.addingService = false;
    this.appModel = modelManager.retrieve('cloud-foundry.model.application');
    this.applicationId = this.appModel.application.summary.guid;

    this.eventService = eventService;
    this.eventService.$on('cf.events.START_ADD_SERVICE_WORKFLOW', function (event, service) {
      that.startWorkflow(service);
    });
  }

  angular.extend(AddServiceWorkflowController.prototype, {

    reset: function () {
      var that = this;

      var path = 'plugins/cloud-foundry/view/applications/workflows/add-service-workflow/';
      this.data = {};

      this.userInput = {
        name: null,
        plan: null
      };

      this.data.workflow = {
        allowJump: false,
        allowBack: false,
        title: gettext('Add Service'),
        btnText: {
          cancel: gettext('Cancel')
        },
        steps: [
          {
            title: gettext('Instance'),
            templateUrl: path + 'instance.html',
            nextBtnText: gettext('Next'),
            onNext: function () {
            }
          },
          {
            title: gettext('Acknowledge'),
            templateUrl: path + 'acknowledge.html',
            nextBtnText: gettext('Done'),
            isLastStep: true
          }
        ]
      };

      this.options = {
        workflow: that.data.workflow,
        plans: [
          { label: 'Free', value: 'free'},
          { label: 'Tiny', value: 'tiny'},
          { label: 'Small', value: 'small'},
          { label: 'Medium', value: 'medium'},
          { label: 'Large', value: 'large'},
          { label: 'Gigando', value: 'gigando'}
        ]
      };

      this.addServiceActions = {
        stop: function () {
          that.stopWorkflow();
        },

        finish: function () {
          that.finishWorkflow();
        }
      };

    },

    addService: function () {
      // this.serviceModel.metadata.guid
    },

    startWorkflow: function (service) {
      this.reset();
      this.addingService = true;
      this.options.workflow.title = "Add Service to " + this.appModel.application.summary.name;
      this.options.workflow.hideStepNavStack = true;
      this.options.service = service;
    },

    stopWorkflow: function () {
      this.addingService = false;
    },

    finishWorkflow: function () {
      this.addingService = false;
    }

  });

})();
