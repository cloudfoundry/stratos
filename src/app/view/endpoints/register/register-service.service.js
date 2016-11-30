(function () {
  'use strict';

  angular
    .module('app.view')
    .factory('app.view.registerService', ServiceRegistrationService);

  ServiceRegistrationService.$inject = [
    '$q',
    '$interpolate',
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
   * @param {object} $interpolate - the Angular $interpolate service
   * @param {app.model.modelManager} modelManager The console model manager service
   * @param {app.view.notificationsService} notificationsService The console notification service
   * @param {helion.framework.widgets.asyncTaskDialog} asyncTaskDialog The framework async detail view
   * @param {app.utils.utilsService} utilsService - the console utils service
   * @property {function} add Opens slide out containing registration form
   * @constructor
   */
  function ServiceRegistrationService($q, $interpolate, modelManager, notificationsService, asyncTaskDialog, utilsService) {
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
       * @param {object} $scope - the angular scope object
       * @param {string} type - the default starting endpoint type
       * @returns {promise}
       */
      add: function ($scope, type) {
        var serviceTypes = [{
          label: utilsService.getOemConfiguration().CLOUD_FOUNDRY,
          value: 'hcf'
        }, {
          label: utilsService.getOemConfiguration().CODE_ENGINE,
          value: 'hce'
        }];
        var startingType = _.find(serviceTypes, {value: type});
        startingType = startingType ? startingType : serviceTypes[0];
        var data = {
          name: '',
          type: startingType.value,
          url: '',
          skipSslValidation: false
        };
        var context = {
          data: data,
          types: serviceTypes,
          description: gettext('Select an endpoint type, then enter it\'s URL and a name to use for this endpoint in the Console.'),
          urlFormName: startingType.value + 'Url',
          nameFormName: startingType.value + 'Name',
          urlValidationExpr: utilsService.urlValidationExpression
        };
        $scope.$watch(function () {
          return data.type;
        }, function (type) {
          context.instances = createInstances(serviceInstanceModel.serviceInstances, type);
          var scope = {};
          switch (data.type) {
            case 'hcf':
              context.typeLabel = utilsService.getOemConfiguration().CLOUD_FOUNDRY;
              scope.endpoint = utilsService.getOemConfiguration().CLOUD_FOUNDRY;
              context.urlHint = $interpolate(gettext('{{ endpoint }} endpoint'))(scope);
              break;
            case 'hce':
              context.typeLabel = utilsService.getOemConfiguration().CODE_ENGINE;
              scope.endpoint = utilsService.getOemConfiguration().CODE_ENGINE;
              context.urlHint = $interpolate(gettext('{{ endpoint }} endpoint'))(scope);
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
