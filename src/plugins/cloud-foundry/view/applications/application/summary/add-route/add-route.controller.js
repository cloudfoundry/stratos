(function() {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.summary')
    .controller('addRouteController', AddRouteController);

  AddRouteController.$inject = [
    'context',
    'content',
    '$stateParams',
    'app.model.modelManager',
    '$uibModalInstance'
  ];

  /**
   * @name AddRouteController
   * @constructor
   * @param {Object} context
   * @param {Object} content
   * @param {Object} $stateParams - the UI router $stateParams service
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {Object} $uibModalInstance
   */
  function AddRouteController(context, content, $stateParams, modelManager, $uibModalInstance) {
    var vm = this;

    vm.context = context;
    vm.content = content;

    vm.addRouteError = false;
    vm.applicationId = $stateParams.guid;
    vm.cnsiGuid = $stateParams.cnsiGuid;
    vm.model = modelManager.retrieve('cloud-foundry.model.application');
    vm.routeModel = modelManager.retrieve('cloud-foundry.model.route');
    vm.uibModelInstance = $uibModalInstance;
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
     * @memberof cloud-foundry.view.applications.application.summary.AddRouteController
     * @description Cancel adding a route. Clear the form and dismiss this form.
     */
    cancel: function() {
      this.uibModelInstance.dismiss();
    },


    /**
     * @function onAddRouteError
     * @memberof cloud-foundry.view.applications.application.summary.AddRouteController
     * @description Display error when adding a route
     */
    onAddRouteError: function() {
      this.addRouteError = true;
    }

  });

})();
