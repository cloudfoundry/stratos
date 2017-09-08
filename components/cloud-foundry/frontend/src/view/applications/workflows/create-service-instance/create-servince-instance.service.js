(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.services')
    .factory('cfServiceCreateServiceInstanceWorkflow', cfServiceCreateServiceInstanceWorkflow);

  /**
   * @memberof cloud-foundry.view.applications.services
   * @name cfServiceCreateServiceInstanceWorkflow
   * @description helper service for creating a new service instance
   * @param {object} $q - the Angular $q service
   * @param {app.model.modelManager} modelManager - the model management service
   * @param {app.framework.widgets.frameworkAsyncTaskDialog} frameworkAsyncTaskDialog The framework async task dialog
   * @returns {object} A service instance factory
   */
  function cfServiceCreateServiceInstanceWorkflow($q, modelManager, frameworkAsyncTaskDialog) {
    var instanceModel = modelManager.retrieve('cloud-foundry.model.service-instance');

    /**
     * @function addService
     * @memberof cloud-foundry.view.applications.AddServiceWorkflowController
     * @description Add a new service instance to the space
     * @param {string} cnsiGuid - id of the Cloud Foundry to add in
     * @param {string} spaceGuid - id of the space to add in
     * @param {object} userInput - user input
     * @returns {object} A promise object
     */
    function addService(cnsiGuid, spaceGuid, userInput) {
      var newInstance = {
        name: userInput.name,
        service_plan_guid: userInput.plan.metadata.guid,
        space_guid: spaceGuid,
        tags: _.map(userInput.tags, function (tag) { return tag.text; }),
        parameters: userInput.params || {}
      };

      if (userInput.params) {
        newInstance.parameters = userInput.params;
      }

      newServiceInstance.name = undefined;

      return instanceModel.createServiceInstance(cnsiGuid, newInstance)
      .then(function (newServiceInstance) {
        if (angular.isDefined(newServiceInstance.metadata)) {
          return newServiceInstance;
        } else {
          throw new Error('Failed to create instance');
        }
      });
    }

    return {
      show: function (cnsiGuid, spaceGuid, instanceNames, servicePlans) {
        var path = 'plugins/cloud-foundry/view/applications/workflows/create-service-instance/create-service-instance.html';
        var options = {
          instanceNames: instanceNames,
          servicePlans: servicePlans,
          userInput: {
            plan: servicePlans.length ? servicePlans[0].value : null
          }
        };

        var doCreate = function () {
          return addService(cnsiGuid, spaceGuid, options.userInput);
        };

        return frameworkAsyncTaskDialog(
          {
            title: 'app.app-info.app-tabs.services.create.title',
            templateUrl: path,
            submitCommit: true,
            buttonTitles: {
              submit: 'app.app-info.app-tabs.services.create.button.yes'
            },
            class: 'dialog-form-larger create-service-instance-dialog',
            dialog: true
          },
          {
            options: options
          },
          doCreate
        ).result;
      }
    };
  }

})();
