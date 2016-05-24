(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications')
    .directive('deleteAppWorkflow', deleteAppWorkflow);

  deleteAppWorkflow.$inject = [];

  /**
   * @memberof cloud-foundry.view.applications
   * @name deleteAppWorkflow
   * @description An delete-app-workflow directive
   * @returns {object} The delete-app-workflow directive definition object
   */
  function deleteAppWorkflow() {
    return {
      controller: DeleteAppWorkflowController,
      controllerAs: 'deleteAppWorkflowCtrl',
      templateUrl: 'plugins/cloud-foundry/view/applications/workflows/delete-app-workflow/delete-app-workflow.html'
    };
  }

  DeleteAppWorkflowController.$inject = [
    'app.model.modelManager',
    'app.event.eventService'
  ];

  /**
   * @memberof cloud-foundry.view.applications
   * @name DeleteAppWorkflowController
   * @constructor
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {app.event.eventService} eventService - the Event management service
   * @property {object} model - the Cloud Foundry applications model
   * @property {object} data - a data bag
   * @property {object} userInput - user's input about new application
   */
  function DeleteAppWorkflowController(modelManager, eventService) {
    var that = this;

    this.deletingApplication = false;
    this.eventService = eventService;
    this.appModel = modelManager.retrieve('cloud-foundry.model.application');
    this.eventService.$on('cf.events.START_DELETE_APP_WORKFLOW', function () {
      that.startWorkflow();
    });
  }

  angular.extend(DeleteAppWorkflowController.prototype, {
    reset: function () {
      var that = this;
      var path = 'plugins/cloud-foundry/view/applications/workflows/delete-app-workflow/';
      this.data = {};
      this.userInput = {
        checkedRouteValue: _.keyBy(this.appModel.application.summary.routes, 'guid'),
        checkedServiceValue: _.keyBy(this.appModel.application.summary.services, 'guid')
      };

      this.data.workflow = {
        allowJump: false,
        allowBack: false,
        allowCancelAtLastStep: true,
        title: gettext('Delete App, Pipeline, and Selected Items'),
        hideStepNavStack: true,
        steps: [
          {
            templateUrl: path + 'delete-services-and-routes.html',
            nextBtnText: gettext('Delete app and associated items'),
            isLastStep: true,
            onNext: function () {
            }
          }
        ]
      };

      this.options = {
        workflow: that.data.workflow,
        userInput: this.userInput,
        appModel: this.appModel
      };

      this.deleteApplicationActions = {
        stop: function () {
          that.stopWorkflow();
        },

        finish: function () {
          that.finishWorkflow();
        }
      };
    },

    /**
     * @function deleteApp
     * @memberOf cloud-foundry.view.applications.AddAppWorkflowController
     * @description delete an application
     */
    deleteApp: function () {
    },

    startWorkflow: function () {
      this.deletingApplication = true;

      this.reset();
    },

    stopWorkflow: function () {
      this.deletingApplication = false;
    },

    finishWorkflow: function () {
      this.deletingApplication = false;
    }
  });

})();
