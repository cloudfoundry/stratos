(function () {
  'use strict';

  angular
    .module('endpoints-dashboard')
    .factory('appRegisterService', ServiceRegistrationFactory);

  /**
   * @name appRegisterService
   * @description Register a service via a slide out
   * @namespace app.view
   * @param {object} $q - the Angular $q service
   * @param {object} $translate - the Angular $translate service
   * @param {app.model.modelManager} modelManager The console model manager service
   * @param {app.utils.appUtilsService} appUtilsService - the console appUtilsService service
   * @param {app.view.appNotificationsService} appNotificationsService The console notification service
   * @param {app.framework.widgets.frameworkDetailView} frameworkDetailView The framework async detail view
   * @param {app.view.endpoints.dashboard.appEndpointsCnsiService} appEndpointsCnsiService - service to support
   *  dashboard with cnsi type endpoints
   * @returns {object} Object containing 'show' function
   */
  function ServiceRegistrationFactory($q, $translate, modelManager, appUtilsService, appNotificationsService,
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
        var endpointTypesToRegister = appEndpointsCnsiService.getEndpointsToRegister();
        var context = {
          wizardOptions: {
            scope: {
              endpoints: endpointTypesToRegister
            },
            workflow: {
              lastStepCommit: true,
              allowCancelAtLastStep: true,
              hideStepNavStack: true,
              title: 'register-dialog.title',
              allowBack: function () {
                return allowBack;
              },
              steps: []
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

        var wizardSteps = [];

        if (endpointTypesToRegister.length > 1) {
          // Show type selection screen only if multiple endpoint types are available
          wizardSteps.push({
            hideNext: true,
            templateUrl: 'plugins/endpoints-dashboard/view/register/register-service-type.html',
            onNext: function () {
              var step = context.wizardOptions.workflow.steps[1];
              step.urlValidationExpr = appUtilsService.urlValidationExpression;
              step.instanceUrls = createInstanceUrls(serviceInstanceModel.serviceInstances, context.wizardOptions.userInput.type);
              step.instanceNames = createInstanceNames(serviceInstanceModel.serviceInstances);
            },
            onEnter: function () {
              allowBack = false;
            }
          });
        }

        var registrationStep = {
          formName: 'regServiceDetails',
          templateUrl: 'plugins/endpoints-dashboard/view/register/register-service-details.html',
          showBusyOnNext: true,
          isLastStep: true,
          nextBtnText: 'register-dialog.register-button',
          onNext: function () {
            var userInput = context.wizardOptions.userInput;
            return serviceInstanceModel.create(userInput.endpoint.cnsi_type, userInput.url, userInput.name, userInput.skipSslValidation).then(function (serviceInstance) {
              appNotificationsService.notify('success', $translate.instant('register-dialog.success-notice', {name: userInput.name}));
              return serviceInstance;
            }).catch(function (response) {
              if (response.status === 403) {
                return $q.reject($translate.instant('register-dialog.failure-ssl-notice', { sllError: response.data.error}));
              }
              return $q.reject('register-dialog.failure-notice');
            });
          },
          onEnter: function () {
            delete context.wizardOptions.userInput.url;
            delete context.wizardOptions.userInput.name;
            delete context.wizardOptions.userInput.skipSslValidation;
            allowBack = true;
          }
        };

        if (endpointTypesToRegister.length === 1) {
          // Since only one type is available, step 1 wasn't displayed. We need to preload these variables before entering step 2
          context.wizardOptions.userInput.endpoint = appEndpointsCnsiService.getEndpointsToRegister()[0];
          registrationStep.urlValidationExpr = appUtilsService.urlValidationExpression;
          registrationStep.instanceUrls = createInstanceUrls(serviceInstanceModel.serviceInstances, context.wizardOptions.userInput.type);
          registrationStep.instanceNames = createInstanceNames(serviceInstanceModel.serviceInstances);
          registrationStep.onEnter = function () {
            delete context.wizardOptions.userInput.url;
            delete context.wizardOptions.userInput.name;
            delete context.wizardOptions.userInput.skipSslValidation;
            allowBack = false;
          };
        }
        // Append Step 2
        wizardSteps.push(registrationStep);
        context.wizardOptions.workflow.steps = wizardSteps;

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
