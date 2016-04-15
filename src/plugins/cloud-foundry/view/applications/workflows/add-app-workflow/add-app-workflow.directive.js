(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications')
    .directive('addAppWorkflow', addAppWorkflow);

  addAppWorkflow.$inject = [];

  /**
   * @namespace cloud-foundry.view.applications.addAppWorkflow
   * @memberof cloud-foundry.view.applications
   * @name addAppWorkflow
   * @description An add-app-workflow directive
   * @returns {object} The add-app-workflow directive definition object
   */
  function addAppWorkflow() {
    return {
      controller: AddAppWorkflowController,
      controllerAs: 'addAppWorkflowCtrl',
      templateUrl: 'plugins/cloud-foundry/view/applications/workflows/add-app-workflow/add-app-workflow.html'
    };
  }

  AddAppWorkflowController.$inject = [];

  /**
   * @namespace cloud-foundry.view.applications.AddAppWorkflowController
   * @memberof cloud-foundry.view.applications
   * @name AddAppWorkflowController
   * @constructor
   * @property {object} workflow - workflow definition
   * @property {object} subflows - mapping of sub-workflow definitions
   * @property {object} options - object to path in to wizard directive
   */
  function AddAppWorkflowController() {
    var that = this;
    var path = 'plugins/cloud-foundry/view/applications/workflows/add-app-workflow/';

    this.workflow = {
      allowJump: false,
      allowBack: false,
      title: gettext('Add Application'),
      btnText: {
        cancel: gettext('Save and Close')
      },
      steps: [
        {
          title: gettext('Name'),
          templateUrl: path + 'name.html',
          nextBtnText: gettext('Next')
        },
        {
          title: gettext('Services'),
          templateUrl: path + 'services.html',
          nextBtnText: gettext('Next')
        },
        {
          title: gettext('Delivery'),
          templateUrl: path + 'delivery.html',
          nextBtnText: gettext('Next'),
          onNext: function () {
            that.appendSubflow(that.subflows[that.options.subflow]);
          }
        }
      ]
    };

    this.subflows = {
      pipeline: [
        {
          ready: true,
          title: gettext('Select Source'),
          templateUrl: path + 'pipeline-subflow/select-source.html',
          nextBtnText: gettext('Next')
        },
        {
          ready: true,
          title: gettext('Select Repository'),
          templateUrl: path + 'pipeline-subflow/select-repository.html',
          nextBtnText: gettext('Next')
        },
        {
          ready: true,
          title: gettext('Pipeline Details'),
          templateUrl: path + 'pipeline-subflow/pipeline-details.html',
          nextBtnText: gettext('Create pipeline')
        },
        {
          ready: true,
          title: gettext('Notifications'),
          templateUrl: path + 'pipeline-subflow/notifications.html',
          nextBtnText: gettext('Next')
        },
        {
          ready: true,
          title: gettext('Deploy'),
          templateUrl: path + 'pipeline-subflow/deploy.html',
          nextBtnText: gettext('Finished code change'),
          isLastStep: true
        }
      ],
      cli: [
        {
          ready: true,
          title: gettext('Deploy'),
          templateUrl: path + 'cli-subflow/deploy.html',
          nextBtnText: gettext('Finished code change'),
          isLastStep: true
        }
      ]
    };

    this.options = {
      workflow: that.workflow
    };
  }

  angular.extend(AddAppWorkflowController.prototype, {

    /**
     * @function appendSubflow
     * @memberOf cloud-foundry.view.applications.AddAppWorkflowController
     * @description append a sub workflow to the main workflow
     * @param {object} subflow - the sub workflow to append
     * @returns {void}
     */
    appendSubflow: function (subflow) {
      [].push.apply(this.workflow.steps, subflow);
    }
  });

})();
