(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.delivery-pipeline', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cf.applications.application.delivery-pipeline', {
      url: '/delivery-pipeline',
      templateUrl: 'plugins/cloud-foundry/view/applications/application/delivery-pipeline/delivery-pipeline.html',
      controller: ApplicationDeliveryPipelineController,
      controllerAs: 'applicationDeliveryPipelineCtrl'
    });
  }

  ApplicationDeliveryPipelineController.$inject = [
    'app.model.modelManager',
    '$stateParams'
  ];

  /**
   * @name ApplicationDeliveryPipelineController
   * @constructor
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {object} $stateParams - the UI router $stateParams service
   * @property {object} model - the Cloud Foundry Applications Model
   * @property {string} id - the application GUID
   */
  function ApplicationDeliveryPipelineController(modelManager, $stateParams) {
    var that = this;
    this.model = modelManager.retrieve('cloud-foundry.model.application');
    this.id = $stateParams.guid;

    this.hceModel = modelManager.retrieve('cloud-foundry.model.hce');

    this.project = null;
    this.notificationTargets = [];
    this.postDeployActions = [];

    this.notificationTargetActions = [
      {
        name: gettext('Delete'),
        execute: function (target) {
          this.hceModel.removeNotificationTarget(target.id)
            .then(function () {
              _.remove(that.notificationTargets, { id: target.id });
            });
        }
      }
    ];

    /* eslint-disable */
    this.postDeployActionActions = [
      { name: gettext('Delete'), execute: function (target) { alert('Delete ' + target); } }
    ];
    this.containerRegistryActions = [
      {
        name: gettext('Designate to Pipeline'),
        execute: function (target) { alert('Designate ' + target.registry_label); }
      },
      {
        name: gettext('Delete Registry'),
        execute: function (target) { alert('Delete ' + target.registry_label); }
      }
    ];
    /* eslint-enable */

    this.hceModel.getUserByGithubId('123456')
      .then(function () {
        that.hceModel.getProjects()
          .then(function () {
            that.getProject();
          });
        that.hceModel.getImageRegistries();
      }, function (response) {
        if (response.status === 404) {
          that.hceModel.createUser('123456', 'login', 'token');
          that.hceModel.getImageRegistries();
        }
      });
  }

  angular.extend(ApplicationDeliveryPipelineController.prototype, {
    getProject: function () {
      var that = this;
      this.project = this.hceModel.getProject(this.model.application.summary.name);
      if (angular.isDefined(this.project)) {
        this.hceModel.getDeploymentTarget(this.project.deployment_target_id)
          .then(function (response) {
            that.project.deploymentTarget = response.data;
          });

        this.hceModel.getBuildContainer(this.project.build_container_id)
          .then(function (response) {
            that.project.buildContainer = response.data;
          });

        this.hceModel.getNotificationTargets(this.project.id)
          .then(function (response) {
            that.notificationTargets.length = 0;
            [].push.apply(that.notificationTargets, response.data);
          });
      }
    }
  });

})();
