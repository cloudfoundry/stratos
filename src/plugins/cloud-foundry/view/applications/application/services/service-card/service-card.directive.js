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
    'app.model.modelManager',
    'helion.framework.widgets.detailView'
  ];

  function ServiceCardController(modelManager, detailView) {
    var that = this;
    this.detailView = detailView;
    this.model = modelManager.retrieve('cloud-foundry.model.service');
    this.spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    this.bindingModel = modelManager.retrieve('cloud-foundry.model.service-binding');
    this.allowAddOnly = angular.isDefined(this.addOnly) ? this.addOnly : false;
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

    this.servicePlans = {};
    this.serviceInstances = {};
    this.serviceBindings = [];

    // Get number of attached service instances to this app for this service
    this.model.allServicePlans(this.cnsiGuid, this.service.metadata.guid)
      .then(function (servicePlans) {
        that.servicePlans = _.keyBy(servicePlans, guidMap);

        var spaceGuid = that.app.summary.space_guid;
        var guids = _.keys(that.servicePlans) || [];
        var q = 'service_plan_guid IN ' + guids.join(',');

        that.spaceModel.listAllServiceInstancesForSpace(that.cnsiGuid, spaceGuid, { q: q })
          .then(function (serviceInstances) {
            that.serviceInstances = _.keyBy(serviceInstances, guidMap);

            var siGuids = _.keys(that.serviceInstances) || [];
            if (siGuids.length > 0) {
              var q = 'service_instance_guid IN ' + siGuids.join(',');

              that.bindingModel.listAllServiceBindings(that.cnsiGuid, { q: q })
                .then(function (bindings) {
                  var appGuid = that.app.summary.guid;
                  var appBindings = _.filter(bindings, function (o) { return o.entity.app_guid === appGuid; });
                  that.serviceBindings.length = 0;
                  [].push.apply(that.serviceBindings, appBindings);

                  that.numAttached = appBindings.length;
                  that.actions[1].hidden = that.numAttached === 0;
                  that.actions[2].hidden = that.numAttached === 0;
                });
            }
          });
      });
  }

  function guidMap(o) {
    return o.metadata.guid;
  }

  angular.extend(ServiceCardController.prototype, {
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
      this.detailView(config, context).closed
        .then(function () {
          that.handleServiceWorkflowFinished();
        });
    },

    detach: function () {

    },

    manageInstances: function () {

    },

    handleServiceWorkflowFinished: function () {
      this.numAttached++;
      this.numAdded++;
    }
  });

})();
