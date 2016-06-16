(function() {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.summary')
    .factory('cloud-foundry.view.applications.application.summary.addRoutes', AddRouteServiceFactory);

  AddRouteServiceFactory.$inject = [
    'app.model.modelManager',
    'helion.framework.widgets.detailView'
  ];

  function AddRouteServiceFactory(modelManager, detailView) {

    return {

      add: function() {

        var model = modelManager.retrieve('cloud-foundry.model.application');
        // Create a map of domain names -> domain guids
        var domains = [];
        model.application.summary.available_domains.forEach(function(domain) {
          domains.push({
            label: domain.name,
            value: domain.guid
          });
        });

        var spaceGuid = model.application.summary.space_guid;

        var data = {
          host: null,
          port: null,
          path: null,
          space_guid: spaceGuid,
          domain_guid: domains[0].value
        };
        return detailView(
          {
            controller: AddRouteController,
            controllerAs: 'addRouteCtrl',
            detailViewTemplateUrl: 'plugins/cloud-foundry/view/applications/' +
            'application/summary/add-route/add-route.html'
          },
          {

            data: data,
            options: {
              domains: domains
            }
          }
        ).result;
      }
    };
  }

  AddRouteController.$inject = [
    '$stateParams',
    'app.model.modelManager',
    '$uibModalInstance',
    'context'
  ];

  /**
   * @name AddRouteController
   * @constructor
   * @param {Object} $stateParams - the UI router $stateParams service
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {Object} $uibModalInstance
   * @param {Object} context
   */
  function AddRouteController($stateParams, modelManager, $uibModalInstance, context) {
    var vm = this;

    vm.addRouteError = false;
    vm.applicationId = $stateParams.guid;
    vm.cnsiGuid = $stateParams.cnsiGuid;
    vm.model = modelManager.retrieve('cloud-foundry.model.application');
    vm.routeModel = modelManager.retrieve('cloud-foundry.model.route');
    vm.uibModelInstance = $uibModalInstance;

    vm.context = context;
  }


  angular.extend(AddRouteController.prototype, {

    addRoute: function() {
      var vm = this;

      var data = {
        space_guid: vm.context.data.space_guid,
        domain_guid: vm.context.data.domain_guid,
        host: vm.context.data.host
      };

      function isUndefinedOrNull(val) {
        return angular.isUndefined(val) || val === null;
      }

      // Deal with optional fields
      if (!isUndefinedOrNull(vm.context.data.port)) {
        data.port = vm.context.data.port;
      }
      if (!isUndefinedOrNull(vm.context.data.path)) {
        data.path = vm.context.data.path;
      }
      vm.routeModel.createRoute(vm.cnsiGuid, data)
        .then(function(response) {

          if (!(response.metadata && response.metadata.guid)) {
            throw 'Invalid response: ' + JSON.stringify(response);
          }
          var routeId = response.metadata.guid;
          return vm.routeModel.associateAppWithRoute(vm.cnsiGuid, routeId, vm.applicationId);
        }).then(function() {
        // Update application summary model
        return vm.model.getAppSummary(vm.cnsiGuid, vm.applicationId);
      }).then(function() {
        vm.uibModelInstance.close();
      }).catch(function() {
        vm.onAddRouteError();
      });
    },
    /**
     * @function cancel
     * @description Cancel adding a route. Clear the form and dismiss this form.
     */
    cancel: function() {
      this.uibModelInstance.dismiss();
    },


    /**
     * @function onAddRouteError
     * @description Display error when adding a route
     */
    onAddRouteError: function() {
      this.addRouteError = true;
    }

  });

})();
