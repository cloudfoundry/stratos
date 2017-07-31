(function () {
  'use strict';

  angular
    .module('cf-app-push')
    .factory('appDeployStepDestinationService', AppDeployStepDestinationService);

  /**
   * @memberof appDeployStepDestinationService
   * @name AppDeployStepDestinationService
   * @constructor
   * @param {object} $q - the angular $q service
   * @param {app.model.modelManager} modelManager - the Model management service
   */
  function AppDeployStepDestinationService($q, modelManager) {

    return {
      getStep: function (session) {
        var serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
        var authModel = modelManager.retrieve('cloud-foundry.model.auth');

        var data = {
          serviceInstances: []
        };

        var userInput = session.userInput.destination;
        userInput.serviceInstance = null;
        userInput.organization = null;
        userInput.space = null;
        var wizardData = session.wizard;

        return {
          step: {
            title: 'deploy-app-dialog.step-destination.title',
            templateUrl: 'plugins/cf-app-push/view/deploy-app-workflow/deploy-step-destination/deploy-step-destination.html',
            formName: 'deploy-destination-form',
            data: data,
            userInput: userInput,
            showBusyOnEnter: 'deploy-app-dialog.step-destination.busy',
            onEnter: function () {
              if (wizardData.fetchedServiceInstances) {
                // Previously been at this step, no need to fetch instances again
                return;
              }
              return serviceInstanceModel.list()
                .then(function (serviceInstances) {
                  var validServiceInstances = _.chain(_.values(serviceInstances))
                    .filter({cnsi_type: 'cf', valid: true})
                    .filter(function (cnsi) {
                      return authModel.doesUserHaveRole(cnsi.guid, authModel.roles.space_developer);
                    })
                    .map(function (o) {
                      return {label: o.name, value: o};
                    })
                    .value();
                  [].push.apply(data.serviceInstances, validServiceInstances);
                  wizardData.fetchedServiceInstances = true;
                }).catch(function () {
                  return $q.reject('deploy-app-dialog.step-destination.enter-failed');
                });
            }
          },
          destroy: angular.noop
        };
      }
    };
  }

})();
