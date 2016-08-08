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
    '$scope',
    'helion.framework.widgets.dialog.confirm',
    'cloud-foundry.view.applications.application.delivery-pipeline.addNotificationService',
    'cloud-foundry.view.applications.application.delivery-pipeline.postDeployActionService'
  ];

  /**
   * @name ApplicationDeliveryPipelineController
   * @constructor
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {object} $stateParams - the UI router $stateParams service
   * @param {object} $scope  - the Angular $scope
   * @param {helion.framework.widgets.dialog.confirm} confirmDialog - the confirmation dialog service
   * @param {object} addNotificationService - Service for adding new notifications
   * @param {object} postDeployActionService - Service for adding a new post-deploy action
   * @property {object} model - the Cloud Foundry Applications Model
   * @property {string} id - the application GUID
   */
  function ApplicationDeliveryPipelineController(modelManager, $stateParams, $scope, confirmDialog, addNotificationService, postDeployActionService) {
    var that = this;
    this.model = modelManager.retrieve('cloud-foundry.model.application');
    this.id = $stateParams.guid;
    this.$scope = $scope;
    this.confirmDialog = confirmDialog;
    this.addNotificationService = addNotificationService;
    this.cnsiModel = modelManager.retrieve('app.model.serviceInstance');
    this.userCnsiModel = modelManager.retrieve('app.model.serviceInstance.user');
    this.account = modelManager.retrieve('app.model.account');
    this.hceModel = modelManager.retrieve('cloud-foundry.model.hce');
    this.postDeployActionService = postDeployActionService;
    this.hceCnsi = null;

    this.project = null;
    this.notificationTargets = [];
    this.postDeployActions = [];

    this.isDeleting = false;
    this.deleteError = false;
    this.busy = false;
    this.modelUpdated = false;

    this.hceServices = {
      fetching: true,
      available: 0,
      valid: 0,
      isAdmin: this.account.isAdmin()
    };

    // Fetch HCE service metadata so that we can show the appropriate message
    this.userCnsiModel.list().finally(function () {
      that.hceServices.available = _.filter(that.cnsiModel.serviceInstances, {cnsi_type: 'hce'}).length;
      that.hceServices.valid = _.filter(that.userCnsiModel.serviceInstances, {cnsi_type: 'hce', valid: true}).length;
      that.hceServices.fetching = false;
    });

    this.notificationTargetActions = [
      {
        name: gettext('Delete'),
        execute: function (target) {
          that.hceModel.removeNotificationTarget(that.hceCnsi.guid, target.id)
            .then(function () {
              _.remove(that.notificationTargets, {id: target.id});
            });
        }
      }
    ];

    /* eslint-disable */
    this.postDeployActionActions = [
      {
        name: gettext('Delete'),
        execute: function (target) {
          alert('Delete ' + target);
        }
      }
    ];
    this.containerRegistryActions = [
      {
        name: gettext('Designate to Pipeline'),
        execute: function (target) {
          alert('Designate ' + target.registry_label);
        }
      },
      {
        name: gettext('Delete Registry'),
        execute: function (target) {
          alert('Delete ' + target.registry_label);
        }
      }
    ];
    /* eslint-disable */

    this.$scope.$watch(function () {
      return !that.model.application.pipeline.fetching &&
        that.model.application.pipeline.valid &&
        that.model.application.pipeline.hce_api_url;
    }, function () {
      if (that.model.application.pipeline.valid && that.model.application.pipeline.hceCnsi) {
        that.busy = true;
        that.hceCnsi = that.model.application.pipeline.hceCnsi;
        that.hceModel.getProjects(that.hceCnsi.guid)
          .then(function () {
            that.getProject();
          })
          .finally(function () {
            that.busy = false;
          });
        that.hceModel.getImageRegistries(that.hceCnsi.guid);
        that.modelUpdated = true;
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
              [].push.apply(that.notificationTargets, response.data);
            });

          this.hceModel.listNotificationTargetTypes(this.hceCnsi.guid);

          this.hceModel.getPipelineTasks(this.hceCnsi.guid, this.project.id)
            .then(function (response) {
              that.postDeployActions.length = 0;
              [].push.apply(that.postDeployActions, response.data);
            });
        }
      }
    },

    addNotificationTarget: function () {
      var that = this;
      this.addNotificationService.add(this.hceCnsi && this.hceCnsi.guid)
        .closed
        .then(function () {
          that.getProject();
        });
    },

    addPostDeployAction: function () {
      var that = this;
      this.postDeployActionService.add(this.hceCnsi.guid, this.project.id)
        .closed
        .then(function () {
          that.getProject();
        });
    }
  });

})();
