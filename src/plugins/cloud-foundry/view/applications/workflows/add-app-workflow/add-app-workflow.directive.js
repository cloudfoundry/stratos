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
    'app.event.eventService'
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
  function AddAppWorkflowController(modelManager, eventService) {
    var that = this;
    var path = 'plugins/cloud-foundry/view/applications/workflows/add-app-workflow/';
    this.addingApplication = false;
    this.eventService = eventService;
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

      // mock data
      domains: [
        { label: 'domain-28.example.com', value: 'domain-28.example.com'},
        { label: 'customer-app-domain1.com', value: 'customer-app-domain1.com'},
        { label: 'customer-app-domain2.com', value: 'customer-app-domain2.com'},
        { label: 'domain-38.example.com', value: 'domain-38.example.com'},
        { label: 'domain-39.example.com', value: 'domain-39.example.com'},
        { label: 'domain-40.example.com', value: 'domain-40.example.com'},
        { label: 'domain-41.example.com', value: 'domain-41.example.com'}
      ]
    };

    this.addApplicationActions = {
      stop: function () {
        that.stopWorkflow();
      },

      finish: function () {
        that.finishWorkflow();
      }
    };

    this.eventService.$on('cf.events.START_ADD_APP_WORKFLOW', this.startWorkflow.bind(this));
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
     * @description create an application
     * @param {string} name - a unique application name
     * @param {string} domain - the selected domain name
     * @returns {Promise} a promise object
     */
    createApp: function () {
    },

    startWorkflow: function () {
      this.addingApplication = true;
    },

    stopWorkflow: function () {
      this.addingApplication = false;
    },

    finishWorkflow: function () {
      this.addingApplication = false;
    }

  });

})();
