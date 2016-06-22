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
   * @param {helion.framework.widgets.detailView} detailView - the detail view service
   * @param {$uibModalInstance} $uibModalInstance - the modal instance
   * @param {object} context - the detail view context/data
   */
  function ManageServicesController(modelManager, detailView, $uibModalInstance, context) {
    this.detailView = detailView;
    this.$uibModalInstance = $uibModalInstance;
    this.bindingModel = modelManager.retrieve('cloud-foundry.model.service-binding');
    this.appModel = modelManager.retrieve('cloud-foundry.model.application');
    this.cnsiGuid = context.cnsiGuid;
    this.app = context.app;
    this.service = context.service;
    this.serviceInstances = [];
    this.serviceBindings = {};

    this.init();
  }

  angular.extend(ManageServicesController.prototype, {
    init: function () {
      var that = this;
      this.serviceInstances = _.filter(this.app.summary.services, function (o) {
        return o.service_plan.service.guid === that.service.metadata.guid;
      });
      if (this.serviceInstances.length > 0) {
        var guids = _.map(this.serviceInstances, 'guid');
        var q = 'service_instance_guid IN ' + guids.join(',');
        return this.appModel.listServiceBindings(this.cnsiGuid, this.app.summary.guid, { q: q })
          .then(function (bindings) {
            that.serviceBindings = _.keyBy(bindings, function (o) { return o.entity.service_instance_guid; });
          });
      }
    },

    detach: function (instance) {
      var that = this;
      var binding = this.serviceBindings[instance.guid];
      return this.bindingModel.deleteServiceBinding(this.cnsiGuid, binding.metadata.guid)
        .then(function (response) {
          if (response.data[that.cnsiGuid] === null) {
            _.pull(that.serviceInstances, instance);
            that.appModel.getAppSummary(that.cnsiGuid, that.app.summary.guid);

            if (that.serviceInstances.length === 0) {
              that.close();
            }
          }
        });
    },

    viewEnvVariables: function (instance) {
      var that = this;
      var serviceLabel = this.service.entity.label;
      return this.appModel.getEnv(this.cnsiGuid, this.app.summary.guid)
        .then(function (variables) {
          var vcap = variables.system_env_json.VCAP_SERVICES;
          if (angular.isDefined(vcap) && vcap[serviceLabel]) {
            var instanceVars = _.find(vcap[serviceLabel], { name: instance.name });
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
