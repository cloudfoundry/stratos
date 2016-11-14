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
    'app.event.eventService',
    'app.model.modelManager',
    'helion.framework.widgets.dialog.confirm',
    'cloud-foundry.view.applications.application.delivery-pipeline.addNotificationService',
    'cloud-foundry.view.applications.application.delivery-pipeline.postDeployActionService',
    'app.utils.utilsService',
    '$interpolate',
    '$stateParams',
    '$scope',
    '$q',
    '$state'
  ];

  /**
   * @name ApplicationDeliveryPipelineController
   * @constructor
   * @param {app.event.eventService} eventService - the application event bus
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {helion.framework.widgets.dialog.confirm} confirmDialog - the confirmation dialog service
   * @param {object} addNotificationService - Service for adding new notifications
   * @param {object} postDeployActionService - Service for adding a new post-deploy action
   * @param {app.utils.utilsService} utils - the console utils service
   * @param {object} $interpolate - the Angular $interpolate service
   * @param {object} $stateParams - the UI router $stateParams service
   * @param {object} $scope  - the Angular $scope
   * @param {object} $q - the Angular $q service
   * @param {object} $state - the UI router $state service
   * @property {object} model - the Cloud Foundry Applications Model
   * @property {string} id - the application GUID
   */
  function ApplicationDeliveryPipelineController(eventService, modelManager, confirmDialog, addNotificationService, postDeployActionService, utils, $interpolate, $stateParams, $scope, $q, $state) {
    var that = this;

    this.model = modelManager.retrieve('cloud-foundry.model.application');
    this.bindingModel = modelManager.retrieve('cloud-foundry.model.service-binding');
    this.userProvidedInstanceModel = modelManager.retrieve('cloud-foundry.model.user-provided-service-instance');
    this.cnsiModel = modelManager.retrieve('app.model.serviceInstance');
    this.userCnsiModel = modelManager.retrieve('app.model.serviceInstance.user');
    this.account = modelManager.retrieve('app.model.account');
    this.hceModel = modelManager.retrieve('cloud-foundry.model.hce');

    this.cnsiGuid = $stateParams.cnsiGuid;
    this.id = $stateParams.guid;
    this.eventService = eventService;
    this.$interpolate = $interpolate;
    this.$scope = $scope;
    this.confirmDialog = confirmDialog;
    this.addNotificationService = addNotificationService;
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

    function init() {
      // Fetch HCE service metadata so that we can show the appropriate message
      that.hceServices.available = _.filter(that.cnsiModel.serviceInstances, {cnsi_type: 'hce'}).length;
      that.hceServices.valid = _.filter(that.userCnsiModel.serviceInstances, {cnsi_type: 'hce', valid: true}).length;
      that.hceServices.fetching = false;
      return $q.resolve();
    }

    utils.chainStateResolve('cf.applications.application.delivery-pipeline', $state, init);

    this.notificationTargetActions = [
      {
        name: gettext('Delete'),
        execute: function (target) {
          that.confirmDialog({
            title: gettext('Delete Notification Target'),
            description: gettext('Are you sure you want to delete this notification target?'),
            buttonText: {
              yes: gettext('Delete'),
              no: gettext('Cancel')
            }
          }).result.then(function () {
            that.hceModel.removeNotificationTarget(that.hceCnsi.guid, target.id)
              .then(function () {
                _.remove(that.notificationTargets, {id: target.id});
              });
          });

        }
      }
    ];

    this.postDeployActionActions = [
      {
        name: gettext('Delete'),
        execute: function (target) {
          that.confirmDialog({
            title: gettext('Delete Post Deploy Task'),
            description: gettext('Are you sure you want to delete this post deploy task?'),
            buttonText: {
              yes: gettext('Delete'),
              no: gettext('Cancel')
            }
          }).result.then(function () {
            that.hceModel.removePipelineTask(that.hceCnsi.guid, target.pipeline_task_id)
              .then(function () {
                _.remove(that.postDeployActions, {pipeline_task_id: target.pipeline_task_id});
              });
          });
        }
      }
    ];

    this.$scope.$watch(function () {
      return !that.model.application.pipeline.fetching &&
        that.model.application.pipeline.valid &&
        that.model.application.pipeline.hce_api_url &&
        that.model.application.project !== null;
    }, function () {
      var pipeline = that.model.application.pipeline;
      if (pipeline && pipeline.valid && pipeline.hceCnsi && that.model.application.project) {
        that.hceCnsi = pipeline.hceCnsi;
        that.project = that.model.application.project;
        that.getPipelineData();
        that.modelUpdated = true;
      } else {
        that.project = null;
      }
    });

    this.$scope.$watch(function () {
      return that.model.application.project;
    }, function (newProject, oldProject) {
      if (!_.isNil(oldProject) && newProject.id === oldProject.id) {
        that.getPipelineData();
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
            return that._deleteHCEServiceInstance();
          })
          .then(function () {
            // show notification for successful binding
            var successMsg = gettext('The pipeline for "{{appName}}" has been deleted.');
            var message = that.$interpolate(successMsg)({appName: that.model.application.summary.name});
            that.eventService.$emit('cf.events.NOTIFY_SUCCESS', {message: message});

            return that.model.updateDeliveryPipelineMetadata();
          })
          .catch(function () {
            that.deleteError = true;
          })
          .finally(function () {
            that.isDeleting = false;
          });
      });
    },

    _deleteHCEServiceInstance: function () {
      var that = this;
      var serviceInstanceGuid = this.model.application.pipeline.hceServiceGuid;
      return this.userProvidedInstanceModel.listAllServiceBindings(this.cnsiGuid, serviceInstanceGuid)
        .then(function (response) {
          var bindingGuid = response.data.resources[0].metadata.guid;
          return that.bindingModel.deleteServiceBinding(that.cnsiGuid, bindingGuid)
            .then(function () {
              return that.userProvidedInstanceModel.deleteUserProvidedServiceInstance(that.cnsiGuid, serviceInstanceGuid);
            });
        });
    },

    getPipelineData: function () {
      if (this.hceCnsi && this.project) {
        var that = this;
        this.hceModel.getBuildContainer(this.hceCnsi.guid, this.project.build_container_id)
          .then(function (response) {
            that.project.buildContainer = response.data;
          });

        this.hceModel.getNotificationTargets(this.hceCnsi.guid, this.project.id)
          .then(function (response) {
            that.notificationTargets.length = 0;
            [].push.apply(that.notificationTargets, that.hceModel.filterNotificationTargets(response.data));
          });

        this.hceModel.listNotificationTargetTypes(this.hceCnsi.guid);

        this.hceModel.getPipelineTasks(this.hceCnsi.guid, this.project.id)
          .then(function (response) {
            that.postDeployActions.length = 0;
            [].push.apply(that.postDeployActions, response.data);
          });
      }
    },

    addNotificationTarget: function () {
      var that = this;
      this.addNotificationService.add(this.hceCnsi && this.hceCnsi.guid)
        .result
        .then(function (notificationTargetData) {
          that.notificationTargets.push(notificationTargetData);
        });
    },

    addPostDeployAction: function () {
      var that = this;
      this.postDeployActionService.add(this.hceCnsi.guid, this.project.id)
        .result
        .then(function (postDeployAction) {
          that.postDeployActions.push(postDeployAction.data);
        });
    }
  });

})();
