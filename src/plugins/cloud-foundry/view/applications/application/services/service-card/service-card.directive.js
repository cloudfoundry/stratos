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
    'modelManager',
    'app.event.eventService',
    'cloud-foundry.view.applications.services.serviceInstanceService'
  ];

  /**
   * @memberof cloud-foundry.view.applications.application.services.serviceCard
   * @name ServiceCardController
   * @description Controller for service card directive
   * @constructor
   * @param {object} $scope - the Angular $scope service
   * @param {app.model.modelManager} modelManager - the application model manager
   * @param {app.event.eventService} eventService - the event management service
   * @param {object} serviceInstanceService - the service instance service
   * @property {app.event.eventService} eventService - the event management service
   * @property {object} serviceInstanceService - the service instance service
   * @property {cloud-foundry.model.service-binding} bindingModel - the Cloud Foundry service binding model
   * @property {boolean} allowAddOnly - allow adding services only (no manage or detach)
   * @property {array} serviceBindings - the service instances bound to specified app
   * @property {number} numAttached - the number of service instances bound to specified app
   * @property {array} actions - the actions that can be performed from this service card
   */
  function ServiceCardController($scope, modelManager, eventService, serviceInstanceService) {
    var that = this;
    this.eventService = eventService;
    this.serviceInstanceService = serviceInstanceService;
    this.bindingModel = modelManager.retrieve('cloud-foundry.model.service-binding');
    this.authModel = modelManager.retrieve('cloud-foundry.model.auth');
    this.allowAddOnly = angular.isDefined(this.addOnly) ? this.addOnly : false;
    this.serviceBindings = [];
    this.numAttached = 0;
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

    $scope.$watch(function () {
      return that.service;
    }, function () {
      that.canBind = that.service._bindTarget === 'APP';
    });
  }

  angular.extend(ServiceCardController.prototype, {
    /**
     * @function init
     * @memberof cloud-foundry.view.applications.application.services.serviceCard.ServiceCardController
     * @description Fetch service bindings for this app and update content
     * @returns {undefined}
     */
    init: function () {
      var serviceInstances = this.getServiceInstanceGuids();
      if (serviceInstances.length > 0) {
        return this.getServiceBindings(serviceInstances);
      } else {
        this.serviceBindings = [];
        this.updateActions();
      }
    },

    /**
     * @function getServiceInstanceGuids
     * @memberof cloud-foundry.view.applications.application.services.serviceCard.ServiceCardController
     * @description Get service instances for app
     * @returns {array} A list of service instance GUIDs
     */
    getServiceInstanceGuids: function () {
      var that = this;
      var serviceInstances = _.chain(this.app.summary.services)
        .filter(function (o) {
          return angular.isDefined(o.service_plan) &&
            o.service_plan.service.guid === that.service.metadata.guid;
        })
        .map('guid')
        .value();
      return serviceInstances;
    },

    /**
     * @function getServiceBindings
     * @memberof cloud-foundry.view.applications.application.services.serviceCard.ServiceCardController
     * @description Get service bindings for specified service instances
     * @param {array} serviceInstanceGuids A list of service instance GUIDs
     * @returns {promise} A promise object
     */
    getServiceBindings: function (serviceInstanceGuids) {
      var that = this;

      var q = 'service_instance_guid IN ' + serviceInstanceGuids.join(',');
      var options = {q: q, 'inline-relations-depth': 1, 'include-relations': 'service_instance'};
      return this.bindingModel.listAllServiceBindings(this.cnsiGuid, options)
        .then(function (bindings) {
          var appGuid = that.app.summary.guid;
          var appBindings = _.filter(bindings, function (o) {
            return o.entity.app_guid === appGuid;
          });
          that.serviceBindings = appBindings;
          that.updateActions();
        });
    },

    /**
     * @function addService
     * @memberof cloud-foundry.view.applications.application.services.serviceCard.ServiceCardController
     * @description Show the add service detail view
     * @returns {undefined}
     */
    addService: function () {
      var config = {
        app: this.app,
        cnsiGuid: this.cnsiGuid,
        confirm: !this.allowAddOnly,
        service: this.service
      };

      this.eventService.$emit('cf.events.START_ADD_SERVICE_WORKFLOW', config);
    },

    /**
     * @function detach
     * @memberof cloud-foundry.view.applications.application.services.serviceCard.ServiceCardController
     * @description Detach service instance from app
     * @returns {undefined}
     */
    detach: function () {
      if (this.serviceBindings.length === 1) {
        var serviceBinding = this.serviceBindings[0];
        return this.serviceInstanceService.unbindServiceFromApp(
          this.cnsiGuid,
          this.app.summary.guid,
          serviceBinding.metadata.guid,
          serviceBinding.entity.service_instance.entity.name
        );
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
        app: this.app,
        cnsiGuid: this.cnsiGuid,
        service: this.service
      };

      this.eventService.$emit('cf.events.START_MANAGE_SERVICES', config);
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
    },

    /**
     * @function updateActions
     * @memberof cloud-foundry.view.applications.application.services.serviceCard.ServiceCardController
     * @description Update service actions visibility
     * @returns {*}
     */
    hideServiceActions: function () {
      return !this.authModel.isAllowed(this.cnsiGuid,
        this.authModel.resources.managed_service_instance,
        this.authModel.actions.create, this.app.summary.space_guid);
    }
  });

})();
