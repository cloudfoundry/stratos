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
    '$stateParams',
    'helion.framework.widgets.dialog.confirm'
  ];

  /**
   * @name ApplicationDeliveryPipelineController
   * @constructor
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {object} $stateParams - the UI router $stateParams service
   * @param {helion.framework.widgets.dialog.confirm} confirmDialog - the confirmation dialog service
   * @property {object} model - the Cloud Foundry Applications Model
   * @property {string} id - the application GUID
   */
  function ApplicationDeliveryPipelineController(modelManager, $stateParams, confirmDialog) {
    var that = this;
    this.model = modelManager.retrieve('cloud-foundry.model.application');
    this.id = $stateParams.guid;
    this.confirmDialog = confirmDialog;

    this.hceModel = modelManager.retrieve('cloud-foundry.model.hce');
    this.hceCnsi = null;

    this.project = null;
    this.notificationTargets = [];
    this.postDeployActions = [];

    this.isDeleting = false;
    this.deleteError = false;

    this.notificationTargetActions = [
      {
        name: gettext('Delete'),
        execute: function (target) {
          this.hceModel.removeNotificationTarget(that.hceCnsi.guid, target.id)
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

    this.cnsiModel = modelManager.retrieve('app.model.serviceInstance');
    this.cnsiModel.list().then(function () {
      var hceCnsis = _.filter(that.cnsiModel.serviceInstances, { cnsi_type: 'hce' }) || [];
      if (hceCnsis.length > 0) {
        that.hceCnsi = hceCnsis[0];
        that.hceModel.getProjects(that.hceCnsi.guid)
          .then(function () {
            that.getProject();
          });
        that.hceModel.getImageRegistries(that.hceCnsi.guid);
      }
    });
  }

  angular.extend(ApplicationDeliveryPipelineController.prototype, {
    deletePipeline: function () {
      var that = this;
      this.confirmDialog({
        title: 'Delete Pipeline',
        description: 'Are you sure you want to delete this pipeline?',
        buttonText: {
          yes: 'Delete',
          no: 'Cancel'
        }
      }).result.then(function () {
        that.isDeleting = true;
        return that.hceModel.removeProject(that.hceCnsi.guid, that.project.id)
          .then(function () {
            that.getProject();
          })
          .catch(function () {
            that.deleteError = true;
          })
          .finally(function () {
            that.isDeleting = false;
          });
      });
    },

    getProject: function () {
      if (this.hceCnsi) {
        var that = this;
        this.project = this.hceModel.getProject(this.model.application.summary.name);
        if (angular.isDefined(this.project)) {
          this.hceModel.getDeploymentTarget(this.hceCnsi.guid, this.project.deployment_target_id)
            .then(function (response) {
              that.project.deploymentTarget = response.data[that.hceCnsi.guid];
            });

          this.hceModel.getBuildContainer(this.hceCnsi.guid, this.project.build_container_id)
            .then(function (response) {
              that.project.buildContainer = response.data[that.hceCnsi.guid];
            });

          this.hceModel.getNotificationTargets(this.hceCnsi.guid, this.project.id)
            .then(function (response) {
              that.notificationTargets.length = 0;
              [].push.apply(that.notificationTargets, response.data[that.hceCnsi.guid]);
            });
        }
      }
    }
  });

})();
