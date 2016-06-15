(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications')
    .controller('manageServicesController', ManageServicesController);

  ManageServicesController.$inject = [
    'app.model.modelManager',
    'helion.framework.widgets.detailView',
    '$uibModalInstance',
    'context'
  ];

  /**
   * @memberof cloud-foundry.view.applications
   * @name AddServiceWorkflowController
   * @constructor
   * @param {app.model.modelManager} modelManager - the Model management service
   */
  function ManageServicesController(modelManager, detailView, $uibModalInstance, context) {
    var that = this;
    this.detailView = detailView;
    this.$uibModalInstance = $uibModalInstance;
    this.bindingModel = modelManager.retrieve('cloud-foundry.model.service-binding');
    this.appModel = modelManager.retrieve('cloud-foundry.model.application');
    this.cnsiGuid = context.cnsiGuid;
    this.app = context.app;
    this.service = context.service;
    this.serviceInstances = context.serviceInstances;
    this.serviceBindings = context.serviceBindings;

    _.each(this.serviceInstances, function (instance) {
      var planGuid = instance.entity.service_plan_guid;
      instance.servicePlan = context.servicePlans[planGuid];
    });
  }

  angular.extend(ManageServicesController.prototype, {

    detach: function (binding) {
      var that = this;
      this.bindingModel.deleteServiceBinding(this.cnsiGuid, binding.metadata.guid)
        .then(function (response) {
          if (response.data[that.cnsiGuid] === null) {
            _.pull(that.serviceBindings, binding);
            if (that.serviceBindings.length === 0) {
              that.close();
            }
          }
        });
    },

    viewEnvVariables: function (binding) {
      var that = this;
      var name = this.service.entity.label;
      var instanceGuid = binding.entity.service_instance_guid;
      var instanceName = _.find(this.serviceInstances, function (o) { return o.metadata.guid === instanceGuid; });
      this.appModel.getEnv(this.cnsiGuid, this.app.summary.guid)
        .then(function (variables) {
          var vcap = variables.system_env_json['VCAP_SERVICES'];
          if (angular.isDefined(vcap) && vcap[name]) {
            var instanceVars = _.find(vcap[name], { name: instanceName.entity.name });
            var config = {
              templateUrl: 'plugins/cloud-foundry/view/applications/application/services/manage-services/env-variables.html',
              title: that.app.summary.name + ': ' + gettext('Environmental Variables')
            };
            var context = {
              variables: instanceVars
            };
            that.detailView(config, context);
          }
        });
    },

    close: function () {
      this.$uibModalInstance.dismiss('close');
    }
  });

})();
