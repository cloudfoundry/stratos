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
   * @property {object} hceModel - the Helion Code Engine model
   * @property {string} id - the application GUID
   * @property {array} notificationTargets - the pipeline's notification targets
   * @property {array} postDeployActions - the pipeline's post deploy actions
   * @property {object} project - the HCE project associated with this app
   */
  function ApplicationDeliveryPipelineController(modelManager, $stateParams) {
    var that = this;
    this.model = modelManager.retrieve('cloud-foundry.model.application');
    this.hceModel = modelManager.retrieve('cloud-foundry.model.hce');
    this.id = $stateParams.guid;
    this.notificationTargets = [];
    this.postDeployActions = [];

    this.hceModel.getImageRegistries();
    this.hceModel.init().then(function () {
      that.init();
    });

    /* eslint-disable */
    this.notificationTargetActions = [
      { name: gettext('Delete'), execute: function (target) { alert('Delete ' + target.name); } }
    ];
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
  }

  angular.extend(ApplicationDeliveryPipelineController.prototype, {
    init: function () {
      var that = this;
      this.project = this.hceModel.getProject(this.model.application.summary.name);
      this.hceModel.getBuildContainers()
        .then(function () {
          var bcId = that.project.build_container_id;
          that.project.buildContainer = _.find(that.hceModel.data.buildContainers,
                                              { build_container_id: bcId }) || {};
        });
      this.hceModel.getNotificationTargets(this.project.id)
        .then(function (response) {
          that.notificationTargets.length = 0;
          [].push.apply(that.notificationTargets, response.data);
        });
    }
  });

})();
