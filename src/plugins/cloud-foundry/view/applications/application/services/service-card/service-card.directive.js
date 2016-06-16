(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.services')
    .directive('serviceCard', serviceCard);

  serviceCard.$inject = [];

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

    detach: function () {
      var that = this;
      if (this.serviceBindings.length === 1) {
        this.bindingModel.deleteServiceBinding(this.cnsiGuid, this.serviceBindings[0].metadata.guid)
          .then(function () {
            that.appModel.getAppSummary(that.cnsiGuid, that.app.summary.guid);
          });
      }
    },

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

    updateActions: function () {
      this.numAttached = this.serviceBindings.length;
      this.actions[1].hidden = this.numAttached !== 1;
      this.actions[2].hidden = this.numAttached === 0;
    }
  });

})();
