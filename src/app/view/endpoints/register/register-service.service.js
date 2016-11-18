(function () {
  'use strict';

  angular
    .module('app.view')
    .factory('app.view.registerService', ServiceRegistrationService);

  ServiceRegistrationService.$inject = [
    '$q',
    'app.model.modelManager',
    'app.view.notificationsService',
    'helion.framework.widgets.asyncTaskDialog',
    'app.utils.utilsService'
  ];

  /**
   * @name ServiceRegistrationService
   * @description Register a service via a slide out
   * @namespace app.view.registerService.ServiceRegistrationService
   * @param {object} $q - the Angular $q service
   * @param {app.model.modelManager} modelManager The console model manager service
   * @param {app.view.notificationsService} notificationsService The console notification service
   * @param {helion.framework.widgets.asyncTaskDialog} asyncTaskDialog The framework async detail view
   * @param {app.utils.utilsService} utilsService - the console utils service
   * @property {function} add Opens slide out containing registration form
   * @constructor
   */
  function ServiceRegistrationService($q, modelManager, notificationsService, asyncTaskDialog, utilsService) {
    var serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');

    function createInstances(serviceInstances, filter) {
      var filteredInstances = _.filter(serviceInstances, {cnsi_type: filter});
      return _.map(filteredInstances, utilsService.getClusterEndpoint);
    }

    return {
      /**
       * @name add
       * @description Opens slide out containing registration form
       * @namespace app.view.registerService.ServiceRegistrationService
       * @param {object} $scope the angular scope object
       * @returns {promise}
       */
      add: function ($scope) {
        var serviceTypes = [{
          label: gettext('Helion Cloud Foundry'),
          value: 'hcf'
        },{
          label: gettext('Helion Code Engine'),
          value: 'hce'
        }];
        var data = {
          name: '',
          type: serviceTypes[0].value,
          url: '',
          skipSslValidation: false
        };
        var context = {
          data: data,
          types: serviceTypes,
          description: gettext('Select an endpoint type, then enter it\'s URL and a name to use for this endpoint in the Console.'),
          urlFormName: serviceTypes[0].value + 'Url',
          nameFormName: serviceTypes[0].value + 'Name',
          urlValidationExpr: utilsService.urlValidationExpression
        };
        $scope.$watch(function () { return data.type; }, function (type) {
          context.instances = createInstances(serviceInstanceModel.serviceInstances, type);
          switch (data.type) {
            case 'hcf':
              context.typeLabel = gettext('Helion Cloud Foundry');
              context.urlHint = gettext('Helion Cloud Foundry API endpoint');
              break;
            case 'hce':
              context.typeLabel = gettext('Helion Code Engine');
              context.urlHint = gettext('Helion Code Engine endpoint');
              break;
            default:
              context.typeLabel = gettext('Service Endpoint');
              context.urlHint = gettext('');
              break;
          }
        });

        return asyncTaskDialog(
          {
            title: gettext('Register Service Endpoint'),
            templateUrl: 'app/view/endpoints/register/register-service.html',
            class: 'detail-view-thin',
            buttonTitles: {
              submit: gettext('Register')
            }
          },
          context,
          function () {

            if (context.customErrorMsg) {
              delete context.errorMsg;
              delete context.customErrorMsg;
            }
            return serviceInstanceModel.create(data.type, data.url, data.name, data.skipSslValidation).then(function (serviceInstance) {
              notificationsService.notify('success',
                gettext('{{endpointType}} endpoint \'{{name}}\' successfully registered'),
                {endpointType: context.typeLabel, name: data.name});
              return serviceInstance;
            }).catch(function (response) {
              if (response.status === 403) {
                context.errorMsg = gettext('Endpoint uses a certificate signed by an unknown authority.' +
                  ' Please check "Skip SSL validation for the endpoint" if the certificate issuer is trusted.');
                // Set flag to indicate that we are setting an error message in code, should be unset upon next retry
                context.customErrorMsg = true;
              }
              return $q.reject(response);
            });
          }
        ).result;
      }
    };
  }

})();
