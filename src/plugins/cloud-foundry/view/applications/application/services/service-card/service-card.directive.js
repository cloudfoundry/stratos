(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.services')
    .directive('serviceCard', serviceCard);

  serviceCard.$inject = [];

  /**
   * @memberof cloud-foundry.view.applications.application.services
   * @name serviceCard
   * @description The service card directive
   * @returns {object} The service card directive definition object
   */
  function serviceCard() {
    return {
      bindToController: {
        app: '=',
        cnsiGuid: '=',
        service: '=',
        addOnly: '=?'
      },
      controller: ServiceCardController,
      controllerAs: 'serviceCardCtrl',
      restrict: 'E',
      scope: {},
      templateUrl: 'plugins/cloud-foundry/view/applications/application/services/service-card/service-card.html'
    };
  }

  ServiceCardController.$inject = [
    '$scope',
    'app.model.modelManager',
    'helion.framework.widgets.detailView'
  ];

  /**
   * @memberof cloud-foundry.view.applications.application.services.serviceCard
   * @name ServiceCardController
   * @description Controller for service card directive
   * @constructor
   * @param {object} $scope - the Angular $scope service
   * @param {app.model.modelManager} modelManager - the application model manager
   * @param {helion.framework.widgets.detailView} detailView - the detail view service
   * @property {helion.framework.widgets.detailView} detailView - the detail view service
   * @property {cloud-foundry.model.application} appModel - the Cloud Foundry application model
   * @property {cloud-foundry.model.service-binding} bindingModel - the Cloud Foundry service binding model
   * @property {boolean} allowAddOnly - allow adding services only (no manage or detach)
   * @property {array} serviceBindings - the service instances bound to specified app
   * @property {number} numAttached - the number of service instances bound to specified app
   * @property {number} numAdded - the number of new service instances bound to specified app
   * @property {array} actions - the actions that can be performed from this service card
   */
  function ServiceCardController($scope, modelManager, detailView) {
    var that = this;
    this.detailView = detailView;
    this.appModel = modelManager.retrieve('cloud-foundry.model.application');
    this.bindingModel = modelManager.retrieve('cloud-foundry.model.service-binding');
    this.allowAddOnly = angular.isDefined(this.addOnly) ? this.addOnly : false;
    this.serviceBindings = [];
    this.numAttached = 0;
    this.numAdded = 0;
    this.actions = [
      {
        name: gettext('Add Service'),
        execute: function () {
          that.addService();
        }
      },
      {
        name: gettext('Detach'),
        execute: function () {
          that.detach();
        }
      },
      {
        name: gettext('Manage Instances'),
        execute: function () {
          that.manageInstances();
        }
      }
    ];

    $scope.$watch(function () {
      return that.app.summary.services;
    }, function () {
      that.init();
    });
  }

  angular.extend(ServiceCardController.prototype, {
    /**
     * @function init
     * @memberof cloud-foundry.view.applications.application.services.serviceCard.ServiceCardController
     * @description Fetch service bindings for this app and update content
     * @returns {void}
     */
    init: function () {
      var that = this;
      var serviceInstances = _.chain(this.app.summary.services)
                              .filter(function (o) {
                                return o.service_plan.service.guid === that.service.metadata.guid;
                              })
                              .map('guid')
                              .value();
      if (serviceInstances.length > 0) {
        var q = 'service_instance_guid IN ' + serviceInstances.join(',');
        this.bindingModel.listAllServiceBindings(this.cnsiGuid, { q: q })
          .then(function (bindings) {
            var appGuid = that.app.summary.guid;
            var appBindings = _.filter(bindings, function (o) { return o.entity.app_guid === appGuid; });
            that.serviceBindings.length = 0;
            [].push.apply(that.serviceBindings, appBindings);
            that.updateActions();
          });
      } else {
        this.serviceBindings.length = 0;
        this.updateActions();
      }
    },

    /**
     * @function addService
     * @memberof cloud-foundry.view.applications.application.services.serviceCard.ServiceCardController
     * @description Show the add service detail view
     * @returns {void}
     */
    addService: function () {
      var that = this;
      var config = {
        controller: 'addServiceWorkflowController',
        controllerAs: 'addServiceWorkflowCtrl',
        detailViewTemplateUrl: 'plugins/cloud-foundry/view/applications/workflows/add-service-workflow/add-service-workflow.html'
      };
      var context = {
        cnsiGuid: this.cnsiGuid,
        service: this.service,
        app: this.app,
        confirm: !this.allowAddOnly
      };
      this.detailView(config, context).result
        .then(function () {
          that.numAdded++;
        });
    },

    /**
     * @function detach
     * @memberof cloud-foundry.view.applications.application.services.serviceCard.ServiceCardController
     * @description Detach service instance from app
     * @returns {void}
     */
    detach: function () {
      var that = this;
      if (this.serviceBindings.length === 1) {
        this.bindingModel.deleteServiceBinding(this.cnsiGuid, this.serviceBindings[0].metadata.guid)
          .then(function () {
            that.appModel.getAppSummary(that.cnsiGuid, that.app.summary.guid);
          });
      }
    },

    /**
     * @function manageInstances
     * @memberof cloud-foundry.view.applications.application.services.serviceCard.ServiceCardController
     * @description Show the manage services detail view
     * @returns {void}
     */
    manageInstances: function () {
      var config = {
        controller: 'manageServicesController',
        controllerAs: 'manageServicesCtrl',
        detailViewTemplateUrl: 'plugins/cloud-foundry/view/applications/application/services/manage-services/manage-services.html'
      };
      var context = {
        cnsiGuid: this.cnsiGuid,
        app: this.app,
        service: this.service
      };
      this.detailView(config, context);
    },

    /**
     * @function updateActions
     * @memberof cloud-foundry.view.applications.application.services.serviceCard.ServiceCardController
     * @description Update service actions visibility
     * @returns {void}
     */
    updateActions: function () {
      this.numAttached = this.serviceBindings.length;
      this.actions[1].hidden = this.numAttached !== 1;
      this.actions[2].hidden = this.numAttached === 0;
    }
  });

})();
