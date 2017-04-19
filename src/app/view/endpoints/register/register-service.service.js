(function () {
  'use strict';

  angular
    .module('app.view')
    .factory('appRegisterService', ServiceRegistrationFactory);

  /**
   * @name appRegisterService
   * @description Register a service via a slide out
   * @namespace app.view
   * @param {object} $q - the Angular $q service
   * @param {app.model.modelManager} modelManager The console model manager service
   * @param {app.utils.appUtilsService} appUtilsService - the console appUtilsService service
   * @param {app.view.appNotificationsService} appNotificationsService The console notification service
   * @param {helion.framework.widgets.frameworkDetailView} frameworkDetailView The framework async detail view
   * @param {app.view.endpoints.dashboard.appEndpointsCnsiService} appEndpointsCnsiService - service to support
   *  dashboard with cnsi type endpoints
   * @returns {object} Object containing 'show' function
   */
  function ServiceRegistrationFactory($q, modelManager, appUtilsService, appNotificationsService,
                                      frameworkDetailView, appEndpointsCnsiService) {

    function createInstanceUrls(serviceInstances, filter) {
      var filteredInstances = _.filter(serviceInstances, {cnsi_type: filter});
      return _.map(filteredInstances, appUtilsService.getClusterEndpoint);
    }

    function createInstanceNames(serviceInstances) {
      return _.map(serviceInstances, 'name');
    }

    return {
      show: function () {
        var serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
        var modal;
        var allowBack = false;
        var context = {
          wizardOptions: {
            scope: {
              endpoints: appEndpointsCnsiService.getEndpointsToRegister()
            },
            workflow: {
              lastStepCommit: true,
              allowCancelAtLastStep: true,
              hideStepNavStack: true,
              title: gettext('Register an Endpoint'),
              allowBack: function () {
                return allowBack;
              },
              steps: [
                {
                  hideNext: true,
                  templateUrl: 'app/view/endpoints/register/register-service-type.html',
                  onNext: function () {
                    var step = context.wizardOptions.workflow.steps[1];
                    step.urlValidationExpr = appUtilsService.urlValidationExpression;
                    step.instanceUrls = createInstanceUrls(serviceInstanceModel.serviceInstances, context.wizardOptions.userInput.type);
                    step.instanceNames = createInstanceNames(serviceInstanceModel.serviceInstances);
                  },
                  onEnter: function () {
                    allowBack = false;
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
                    return serviceInstanceModel.create(userInput.endpoint.cnsi_type, userInput.url, userInput.name, userInput.skipSslValidation).then(function (serviceInstance) {
                      appNotificationsService.notify('success',
                        gettext('Endpoint \'{{name}}\' successfully registered'),
                        { name: userInput.name });
                      return serviceInstance;
                    }).catch(function (response) {
                      if (response.status === 403) {
                        return $q.reject(response.data.error + gettext('. Please check "Skip SSL validation for the endpoint" if the certificate issuer is trusted.'));
                      }
                      return $q.reject(gettext('There was a problem creating the endpoint. Please ensure the endpoint address ' +
                        'is correct and try again. If this error persists, please contact the administrator.'));
                    });
                  },
                  onEnter: function () {
                    delete context.wizardOptions.userInput.url;
                    delete context.wizardOptions.userInput.name;
                    delete context.wizardOptions.userInput.skipSslValidation;
                    allowBack = true;
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
        modal = frameworkDetailView({
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
