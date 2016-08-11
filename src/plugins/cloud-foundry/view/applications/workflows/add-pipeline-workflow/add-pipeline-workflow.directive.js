(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications')
    .directive('addPipelineWorkflow', addPipelineWorkflow)
    .run(run);

  addPipelineWorkflow.$inject = [];

  /**
   * @memberof cloud-foundry.view.applications
   * @name addAppWorkflow
   * @description An add-app-workflow directive
   * @returns {object} The add-app-workflow directive definition object
   */
  function addPipelineWorkflow() {
    return {
      controller: AddPipelineWorkflowController,
      controllerAs: 'addPipelineWorkflowCtrl',
      templateUrl: 'plugins/cloud-foundry/view/applications/workflows/add-pipeline-workflow/add-pipeline-workflow.html'
    };
  }

  AddPipelineWorkflowController.$inject = [
    'app.model.modelManager',
    'app.event.eventService',
    'github.view.githubOauthService',
    'app.utils.utilsService',
    '$scope',
    '$q',
    '$timeout',
    '$stateParams'
  ];

  /**
   * @memberof cloud-foundry.view.applications
   * @name AddAppWorkflowController
   * @constructor
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {app.event.eventService} eventService - the Event management service
   * @param {object} githubOauthService - github oauth service
   * @param {app.model.utilsService} utils - the utils service
   * @param {object} $scope - Angular $scope
   * @param {object} $q - Angular $q service
   * @param {object} $timeout - the Angular $timeout service
   * @param {object} $stateParams - the UI router $stateParams service
   * @property {app.model.modelManager} modelManager - the Model management service
   * @property {app.event.eventService} eventService - the Event management service
   * @property {github.view.githubOauthService} githubOauthService - github oauth service
   * @property {app.model.utilsService} utils - the utils service
   * @property {object} $scope - angular $scope
   * @property {object} $q - angular $q service
   * @property {object} $timeout - the Angular $timeout service
   * @property {object} userInput - user's input about new application
   * @property {object} options - workflow options
   */
  function AddPipelineWorkflowController(modelManager, eventService, githubOauthService, utils, $scope, $q, $timeout, $stateParams) {
    this.modelManager = modelManager;
    this.eventService = eventService;
    this.githubOauthService = githubOauthService;
    this.utils = utils;
    this.$scope = $scope;
    this.$q = $q;
    this.$timeout = $timeout;
    this.userInput = {};
    this.options = {};
    this.cnsiGuid = $stateParams.cnsiGuid;

    this.init();
  }

  run.$inject = [
    'cloud-foundry.view.applications.workflows.add-pipeline-workflow.prototype'
  ];

  function run(addPipelineWorkflowPrototype) {
    angular.extend(AddPipelineWorkflowController.prototype, addPipelineWorkflowPrototype, {
      getEndpoint: function () {
        return this.utils.getClusterEndpoint(
          this.modelManager.retrieve('app.model.serviceInstance.user').serviceInstances[this.cnsiGuid]
        );
      },

      reset: function () {
        var that = this;
        var path = 'plugins/cloud-foundry/view/applications/workflows/add-pipeline-workflow/';
        this.data = {};
        this.errors = {};

        this.userInput = {
          application: null,
          hceCnsi: null,
          source: null,
          repo: null,
          branch: null,
          buildContainer: null,
          imageRegistry: null,
          projectId: null
        };

        this.data.workflow = {
          allowJump: false,
          allowBack: false,
          title: gettext('Add Pipeline'),
          steps: [
            {
              ready: true,
              title: gettext('Select Endpoint'),
              templateUrl: path + 'select-endpoint.html',
              formName: 'application-endpoint-form',
              onNext: function () {
                return that.getVcsInstances();
              }
            }
          ].concat(this.getWorkflowDefinition().steps)
        };

        this.options = {
          workflow: that.data.workflow,
          userInput: this.userInput,
          errors: this.errors,
          apps: [],
          hceCnsis: [],
          notificationTargets: [
            {
              title: 'HipChat',
              description: gettext('Connect a HipChat instance to receive pipeline events (build, test, deploy) in a  Hipchat room.'),
              img: 'hipchat_logo.png'
            },
            {
              title: 'Http',
              description: gettext('Specify an endpoint where pipeline events should be sent (e.g. URL of an internal website, a communication tool, or an RSS feed).'),
              img: 'httppost_logo.png'
            },
            {
              title: 'Flow Dock',
              description: gettext('Connect a Flowdock instance to receive pipeline events (build, test, deploy) in a specific Flow.'),
              img: 'flowdock_logo.png'
            }
          ],
          sources: [],
          repos: [],
          branches: [],
          buildContainers: [],
          imageRegistries: []
        };

        this.addPipelineActions = {
          stop: function () {
            that.stopWorkflow();
          },

          finish: function () {
            that.finishWorkflow();
          }
        };
      }
    });
  }

})();
