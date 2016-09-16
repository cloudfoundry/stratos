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
    this.hceModel = modelManager.retrieve('cloud-foundry.model.hce');

    this.init();
  }

  run.$inject = [
    'cloud-foundry.view.applications.workflows.add-pipeline-workflow.prototype'
  ];

  function run(addPipelineWorkflowPrototype) {
    angular.extend(AddPipelineWorkflowController.prototype, addPipelineWorkflowPrototype, {
      reset: function () {
        var that = this;
        var path = 'plugins/cloud-foundry/view/applications/workflows/add-pipeline-workflow/';
        this.data = {};
        this.errors = {};

        var application = this.modelManager.retrieve('cloud-foundry.model.application').application;
        var route = application.summary.routes[0];
        var host, domain;

        if (route) {
          host = route.host;
          domain = { entity: route.domain };
        }

        this.userInput = {
          name: application.summary.name,
          serviceInstance: application.cluster,
          clusterUsername: null,
          clusterPassword: null,
          organization: application.organization,
          space: application.space,
          host: host,
          domain: domain,
          application: application,
          hceCnsi: null,
          source: null,
          repo: null,
          repoFilterTerm: null,
          branch: null,
          buildContainer: null,
          projectId: null,
          imageRegistry: null,
          searchCategory: 'all',
          search: {
            entity: {
              extra: undefined
            }
          }
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

        this.setOptions();

        this.addPipelineActions = {
          stop: function () {
            that.stopWorkflow();
          },

          finish: function () {
            that.modelManager.retrieve('cloud-foundry.model.application').updateDeliveryPipelineMetadata(true);
            that.finishWorkflow();
          }
        };
      }
    });
  }

})();
