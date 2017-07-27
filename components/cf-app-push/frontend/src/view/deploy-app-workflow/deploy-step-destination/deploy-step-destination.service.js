(function () {
  'use strict';

  angular
    .module('cf-app-push')
    .factory('appDeployStepDestinationService', AppDeployStepDestinationService);

  function AppDeployStepDestinationService($q, modelManager) {

    return {
      getStep: function (session) {
        var serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
        var authModel = modelManager.retrieve('cloud-foundry.model.auth');

        var data = session.data.destination;
        var userInput = session.userInput.destination;

        data.serviceInstances = [];
        userInput.serviceInstance = null;
        userInput.organization = null;
        userInput.space = null;

        return {
          step: {
            title: 'deploy-app-dialog.step-destination.title',
            templateUrl: 'plugins/cf-app-push/view/deploy-app-workflow/deploy-step-destination/deploy-step-destination.html',
            formName: 'deploy-destination-form',
            data: data,
            userInput: userInput,
            showBusyOnEnter: 'deploy-app-dialog.step-destination.busy',
            onEnter: function () {
              if (data.deployStatus) {
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
                }).catch(function () {
                  return $q.reject('deploy-app-dialog.step-destination.enter-failed');
                });
            }
          },
          destroy: function () {
            //TODO: RC
          }
        };
      }
    };
  }

})();
