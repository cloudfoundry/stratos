(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications')
    .directive('manageServices', manageServices);

  manageServices.$inject = [];

  /**
   * @memberof cloud-foundry.view.applications
   * @name manageServices
   * @description An manage services detail view
   * @returns {object} The manage-services directive definition object
   */
  function manageServices() {
    return {
      controller: ManageServicesController,
      controllerAs: 'manageServicesCtrl',
      restrict: 'E'
    };
  }

  ManageServicesController.$inject = [
    '$q',
    '$scope',
    'app.model.modelManager',
    'app.event.eventService',
    'helion.framework.widgets.detailView',
    'helion.framework.widgets.dialog.confirm'
  ];

  /**
   * @memberof cloud-foundry.view.applications
   * @name ManageServicesController
   * @constructor
   * @param {object} $q - the Angular $q service
   * @param {object} $scope - the Angular $scope service
   * @param {app.model.modelManager} modelManager - the model management service
   * @param {app.event.eventService} eventService - the event management service
   * @param {helion.framework.widgets.detailView} detailView - the detail view service
   * @param {helion.framework.widgets.dialog.confirm} confirmDialog - the confirmation dialog
   * @property {object} $q - the Angular $q service
   * @property {helion.framework.widgets.detailView} detailView - the detail view service
   * @property {helion.framework.widgets.dialog.confirm} confirmDialog - the confirmation dialog
   * @property {cloud-foundry.model.application} appModel - the CF application model
   * @property {cloud-foundry.model.service-binding} bindingModel - the CF service binding model
   * @property {object} modal - the detail view modal instance
   * @property {array} serviceInstances - service instances associated with this service
   * @property {object} serviceBindings - service bindings associated with this app
   */
  function ManageServicesController($q, $scope, modelManager, eventService, detailView, confirmDialog) {
    var that = this;
    this.$q = $q;
    this.detailView = detailView;
    this.confirmDialog = confirmDialog;
    this.appModel = modelManager.retrieve('cloud-foundry.model.application');
    this.bindingModel = modelManager.retrieve('cloud-foundry.model.service-binding');
    this.modal = null;

    this.serviceInstances = [];
    this.serviceBindings = {};

    var manageServicesEvent = eventService.$on('cf.events.START_MANAGE_SERVICES', function (event, config) {
      that.$q.when(that.reset(config)).then(function () {
        that.modal = that.startManageServices();
      });
    });
    $scope.$on('$destroy', manageServicesEvent);
  }

  angular.extend(ManageServicesController.prototype, {
    /**
     * @function reset
     * @memberof cloud-foundry.view.applications.ManageServicesController
     * @description Reset the view to an initial state
     * @param {object} config - data containing app, service, etc.
     * @returns {promise} A promise object
     */
    reset: function (config) {
      var that = this;
      this.data = {
        app: config.app,
        service: config.service,
        cnsiGuid: config.cnsiGuid
      };
      this.serviceInstances.length = 0;
      this.serviceBindings = {};

      var serviceInstances = _.filter(this.data.app.summary.services, function (o) {
        return angular.isDefined(o.service_plan) &&
          o.service_plan.service.guid === that.data.service.metadata.guid;
      });
      if (serviceInstances.length > 0) {
        [].push.apply(this.serviceInstances, serviceInstances);

        var guids = _.map(this.serviceInstances, 'guid');
        return this.getServiceBindings(guids);
      }
    },

    /**
     * @function getServiceBindings
     * @memberof cloud-foundry.view.applications.ManageServicesController
     * @description Retrieve service bindings for service instances
     * @param {array} serviceInstanceGuids - a list of service instance GUIDs
     * @returns {promise} A promise object
     */
    getServiceBindings: function (serviceInstanceGuids) {
      var that = this;
      var q = 'service_instance_guid IN ' + serviceInstanceGuids.join(',');
      return this.appModel.listServiceBindings(this.data.cnsiGuid, this.data.app.summary.guid, { q: q })
        .then(function (bindings) {
          that.serviceBindings = _.keyBy(bindings, function (o) { return o.entity.service_instance_guid; });
        });
    },

    /**
     * @function detach
     * @memberof cloud-foundry.view.applications.ManageServicesController
     * @description Detach service instance
     * @param {object} instance - the service instance to detach
     * @returns {promise} A promise object
     */
    detach: function (instance) {
      var that = this;
      var binding = this.serviceBindings[instance.guid];
      return this.confirmDialog({
        title: gettext('Detach Service'),
        description: gettext('Are you sure you want to detach ') + instance.name + '?',
        errorMessage: gettext('There was a problem detaching this service. Please try again. If this error persists, please contact the Administrator.'),
        buttonText: {
          yes: gettext('Detach'),
          no: gettext('Cancel')
        },
        callback: function () {
          return that.bindingModel.deleteServiceBinding(that.data.cnsiGuid, binding.metadata.guid)
            .then(function (response) {
              if (response.data[that.data.cnsiGuid] === null) {
                _.pull(that.serviceInstances, instance);

                if (that.serviceInstances.length === 0) {
                  that.modal.dismiss('close');
                }

                return that.appModel.getAppSummary(that.data.cnsiGuid, that.data.app.summary.guid);
              }
            });
        }
      });
    },

    /**
     * @function viewEnvVariables
     * @memberof cloud-foundry.view.applications.ManageServicesController
     * @description View environmental variables of service instance
     * @param {object} instance - the service instance to view
     * @returns {promise} A promise object
     */
    viewEnvVariables: function (instance) {
      var that = this;
      var serviceLabel = this.data.service.entity.label;
      return this.appModel.getEnv(this.data.cnsiGuid, this.data.app.summary.guid)
        .then(function (variables) {
          var vcap = variables.system_env_json.VCAP_SERVICES;
          if (angular.isDefined(vcap) && vcap[serviceLabel]) {
            var instanceVars = _.find(vcap[serviceLabel], { name: instance.name });
            var config = {
              templateUrl: 'plugins/cloud-foundry/view/applications/application/services/manage-services/env-variables.html',
              title: that.data.app.summary.name + ': ' + gettext('Environmental Variables')
            };
            var context = {
              variables: instanceVars
            };
            that.detailView(config, context);
          }
        });
    },

     /**
     * @function startManageService
     * @memberof cloud-foundry.view.applications.ManageServicesController
     * @description Show the manage services detail view
     * @returns {promise} A promise object
     */
    startManageServices: function () {
      var config = {
        templateUrl: 'plugins/cloud-foundry/view/applications/application/services/manage-services/manage-services.html',
        title: gettext('Manage Service Instances')
      };

      return this.detailView(config, this);
    }
  });

})();
