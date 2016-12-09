(function () {
  'use strict';

  angular
    .module('app.view')
    .factory('app.view.registerService', ServiceRegistrationFactory);

  ServiceRegistrationFactory.$inject = [
    '$q',
    'app.model.modelManager',
    'app.utils.utilsService',
    'app.view.notificationsService',
    'helion.framework.widgets.detailView'
  ];

  /**
   * @name ServiceRegistrationFactory
   * @description Register a service via a slide out
   * @namespace app.view.registerService.ServiceRegistrationService
   * @param {object} $q - the Angular $q service
   * @param {app.model.modelManager} modelManager The console model manager service
   * @param {app.utils.utilsService} utilsService - the console utils service
   * @param {app.view.notificationsService} notificationsService The console notification service
   * @param {helion.framework.widgets.detailView} detailView The framework async detail view
   * @returns {object} Object containing 'show' function
   */
  function ServiceRegistrationFactory($q, modelManager, utilsService, notificationsService, detailView) {

    function createInstances(serviceInstances, filter) {
      var filteredInstances = _.filter(serviceInstances, {cnsi_type: filter});
      return _.map(filteredInstances, utilsService.getClusterEndpoint);
    }

    return {
      show: function () {
        var serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
        var modal;
        var context = {
          wizardOptions: {
            workflow: {
              allowCancelAtLastStep: true,
              hideStepNavStack: true,
              title: gettext('Register an endpoint'),
              steps: [
                {
                  hideNext: true,
                  templateUrl: 'app/view/endpoints/register/register-service-type.html',
                  onNext: function () {
                    var step = context.wizardOptions.workflow.steps[1];
                    switch (context.wizardOptions.userInput.type) {
                      case 'hcf':
                        step.product = gettext('Helion Cloud Foundry');
                        step.title = gettext('Register a Helion Cloud Foundry Endpoint');
                        step.nameOfNameInput = 'hcfName';
                        step.nameOfUrlInput = 'hcfUrl';
                        step.urlHint = gettext('Helion Cloud Foundry API endpoint');
                        break;
                      case 'hce':
                        step.product = gettext('Helion Code Engine');
                        step.title = gettext('Register a Helion Code Engine Endpoint');
                        step.nameOfNameInput = 'hceName';
                        step.nameOfUrlInput = 'hceUrl';
                        step.urlHint = gettext('Helion Code Engine endpoint');
                        break;
                      default:
                        step.product = gettext('Endpoint');
                        step.title = gettext('Register Endpoint');
                        step.typeLabel = gettext('Service Endpoint');
                        step.urlHint = gettext('');
                        break;
                    }
                    step.urlValidationExpr = utilsService.urlValidationExpression;
                    step.instances = createInstances(serviceInstanceModel.serviceInstances, context.wizardOptions.userInput.type);
                  },
                  onEnter: function () {
                    context.wizardOptions.workflow.allowBack = false;
                  }
                },
                {
                  formName: 'regServiceDetails',
                  templateUrl: 'app/view/endpoints/register/register-service-details.html',
                  showBusyOnNext: true,
                  isLastStep: true,
                  nextBtnText: gettext('Register'),
                  onNext: function () {
                    var userInput = context.wizardOptions.userInput;
                    var stepTwo = context.wizardOptions.workflow.steps[1];
                    return serviceInstanceModel.create(userInput.type, userInput.url, userInput.name, userInput.skipSslValidation).then(function (serviceInstance) {
                      notificationsService.notify('success',
                        gettext('{{endpointType}} endpoint \'{{name}}\' successfully registered'),
                        {endpointType: stepTwo.product, name: userInput.name});
                      return serviceInstance;
                    }).catch(function (response) {
                      if (response.status === 403) {
                        return $q.reject(gettext('Endpoint uses a certificate signed by an unknown authority.' +
                          ' Please check "Skip SSL validation for the endpoint" if the certificate issuer is trusted.'));
                      }
                      return $q.reject(gettext('There was a problem creating the endpoint. Please ensure the endpoint address ' +
                        'is correct and try again. If this error persists, please contact the administrator.'));
                    });
                  },
                  onEnter: function () {
                    delete context.wizardOptions.userInput.url;
                    delete context.wizardOptions.userInput.name;
                    delete context.wizardOptions.userInput.skipSslValidation;
                    context.wizardOptions.workflow.allowBack = true;
                  }
                }
              ]
            },
            userInput: {}
          },
          wizardActions: {
            stop: function () {
              modal.close();
            },

            finish: function () {
              modal.close();
            }
          }
        };
        modal = detailView({
          template: '<wizard ' +
          'class="register-service-wizard" ' +
          'actions="context.wizardActions" ' +
          'options="context.wizardOptions">' +
          '</wizard>'
        }, context);

        return modal.result;
      }
    };
  }

})();
