(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.services')
    .factory('cfServiceDeleteAppWorkflow', cfServiceDeleteAppWorkflow);

  /**
   * @memberof cloud-foundry.view.applications.services
   * @name cfServiceInstanceService
   * @description helper service for delete-app logic
   * @param {object} $q - the Angular $q service
   * @param {app.model.modelManager} modelManager - the model management service
   * @param {app.utils.appUtilsService} appUtilsService - the appUtilsService service
   * @returns {object} A service instance factory
   */
  function cfServiceDeleteAppWorkflow($q, modelManager, appUtilsService) {
    var appModel = modelManager.retrieve('cloud-foundry.model.application');
    var serviceInstanceModel = modelManager.retrieve('cloud-foundry.model.service-instance');

    return {
      unbindServiceInstances: unbindServiceInstances,
      deleteServiceInstances: deleteServiceInstances,
      deleteServiceInstanceIfPossible: deleteServiceInstanceIfPossible
    };

    /**
     * @function unbindServiceInstances
     * @memberOf cloud-foundry.view.applications.services.cfServiceDeleteAppWorkflow
     * @description Unbind service instance from app
     * @param {string} cnsiGuid - the service instance GUID
     * @param {array} bindingGuids - the service binding GUIDs
     * @returns {object} A resolved/rejected promise
     */
    function unbindServiceInstances(cnsiGuid, bindingGuids) {

      var appGuid = appModel.application.summary.guid;
      var q = 'service_instance_guid IN ' + bindingGuids.join(',');
      return appModel.listServiceBindings(cnsiGuid, appGuid, {q: q})
        .then(function (bindings) {
          var funcStack = [];

          angular.forEach(bindings, function (binding) {
            funcStack.push(function () {
              return appModel.unbindServiceFromApp(cnsiGuid, appGuid, binding.metadata.guid);
            });
          });

          return appUtilsService.runInSequence(funcStack);
        });
    }

    /**
     * @function deleteServiceInstances
     * @memberOf cloud-foundry.view.applications.services.cfServiceDeleteAppWorkflow
     * @description Delete service instances
     * @param {array} safeServiceInstances - the service instance GUIDs
     * @returns {object} A resolved/rejected promise
     */
    function deleteServiceInstances(safeServiceInstances) {
      var funcStack = [];

      angular.forEach(safeServiceInstances, function (serviceInstanceGuid) {
        funcStack.push(function () {
          return deleteServiceInstanceIfPossible(serviceInstanceGuid);
        });
      });

      return appUtilsService.runInSequence(funcStack);
    }

    /**
     * @function _deleteServiceInstanceIfPossible
     * @memberOf cloud-foundry.view.applications.services.cfServiceDeleteAppWorkflow
     * @description Delete service instance if possible. Ignore AssociationNotEmpty
     * errors.
     * @param {string} cnsiGuid - the service instance GUID
     * @param {string} serviceInstanceGuid - the service instance GUID
     * @returns {object} A resolved/rejected promise
     */
    function deleteServiceInstanceIfPossible(cnsiGuid, serviceInstanceGuid) {
      return $q(function (resolve, reject) {
        serviceInstanceModel.deleteServiceInstance(cnsiGuid, serviceInstanceGuid)
          .then(resolve, function (response) {
            if (response.data.error_code === 'CF-AssociationNotEmpty') {
              resolve();
            } else {
              reject();
            }
          });
      });
    }
  }

})();
