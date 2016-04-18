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

  AddAppWorkflowController.$inject = [
    'app.model.modelManager',
  ];

  /**
   * @namespace cloud-foundry.view.applications.AddAppWorkflowController
   * @memberof cloud-foundry.view.applications
   * @name AddAppWorkflowController
   * @constructor
   * @param {app.model.modelManager} modelManager - the Model management service
   * @property {object} model - the Cloud Foundry applications model
   * @property {object} data - a data bag
   * @property {object} userInput - user's input about new application
   */
  function AddAppWorkflowController(modelManager) {
    var that = this;
    var path = 'plugins/cloud-foundry/view/applications/workflows/add-app-workflow/';

    this.model = modelManager.retrieve('cloud-foundry.model.application');
    this.data = {};

    this.userInput = {
      name: null,
      domain: null
    };

    this.data.workflow = {
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
          form: 'application-name-form',
          nextBtnText: gettext('Create and continue'),
          onNext: function () {
            that.createApp(that.userInput.name, that.userInput.domain).then(function (response) {
              console.log(response);
            });
          }
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
            that.appendSubflow(that.data.subflows[that.options.subflow]);
          }
        }
      ]
    };

    this.data.subflows = {
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
          nextBtnText: gettext('Finished with code change'),
          isLastStep: true
        }
      ],
      cli: [
        {
          ready: true,
          title: gettext('Deploy'),
          templateUrl: path + 'cli-subflow/deploy.html',
          nextBtnText: gettext('Finished with code change'),
          isLastStep: true
        }
      ]
    };

    this.options = {
      workflow: that.data.workflow,
      userInput: this.userInput,
      domains: [
        { label: 'domain A', value: 'domain-a'},
        { label: 'domain B', value: 'domain-b'},
        { label: 'domain C', value: 'domain-c'},
        { label: 'domain D', value: 'domain-d'}
      ]
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
      [].push.apply(this.data.workflow.steps, subflow);
    },

    /**
     * @function createApp
     * @memberOf cloud-foundry.view.applications.AddAppWorkflowController
     * @description append a sub workflow to the main workflow
     * @param {string} name - a unique application name
     * @param {string} domain - the selected domain name
     * @returns {Promise} a promise object
     */
    createApp: function (name, domain) {
      console.log(name, domain);
      return this.model.stopApp({
        name: name,
        domain: domain
      });
    }

  });

})();
