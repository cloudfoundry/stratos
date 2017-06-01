(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.summary', [])
    .config(registerRoute)
    .run(registerAppTab);

  function registerRoute($stateProvider) {
    $stateProvider.state('cf.applications.application.summary', {
      url: '/summary',
      params: {
        newlyCreated: false
      },
      templateUrl: 'plugins/cloud-foundry/view/applications/application/summary/summary.html',
      controller: ApplicationSummaryController,
      controllerAs: 'applicationSummaryCtrl'
    });
  }

  function registerAppTab($state, $stateParams, cfApplicationTabs, modelManager) {
    var model = modelManager.retrieve('cloud-foundry.model.application');
    var authModel = modelManager.retrieve('cloud-foundry.model.auth');

    cfApplicationTabs.tabs.push({
      position: 1,
      hide: false,
      uiSref: 'cf.applications.application.summary',
      label: 'app.tabs.summary.label',
      appCreatedInstructions: [{
        id: 'new-app-deploy-cli',
        position: 2,
        description: 'app.tabs.summary.instructions.cli',
        show: function () {
          return authModel.isAllowed($stateParams.cnsiGuid, authModel.resources.application, authModel.actions.update,
            model.application.summary.space_guid);
        },
        go: function (appActions) {
          var cliAction = _.find(appActions, {id: 'cli'});
          if (cliAction && !cliAction.disabled && !cliAction.hidden) {
            cliAction.execute();
          }
        }
      }, {
        id: 'new-app-add-services',
        position: 3,
        description: 'app.tabs.summary.instructions.service',
        show: function () {
          return authModel.isAllowed($stateParams.cnsiGuid, authModel.resources.managed_service_instance,
            authModel.actions.create, model.application.summary.space_guid);
        },
        go: function (appActions, appGuid) {
          $state.go('cf.applications.application.services', {guid: appGuid});
        }
      }]
    });

  }

  /**
   * @name ApplicationSummaryController
   * @constructor
   * @param {object} $state - UI Router $state
   * @param {object} $stateParams - the UI router $stateParams service
   * @param {object} $log - the angular $log service
   * @param {object} $q - the angular $q service
   * @param {object} $translate - the Angular $translate service
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {cfAddRoutes} cfAddRoutes - add routes service
   * @param {cfEditApp} cfEditApp - edit Application
   * @param {app.utils.appUtilsService} appUtilsService - the appUtilsService service
   * @param {appClusterRoutesService} appClusterRoutesService - the Service management service
   * @param {app.framework.widgets.dialog.frameworkDialogConfirm} frameworkDialogConfirm - the confirm dialog service
   * @param {app.view.appNotificationsService} appNotificationsService - the toast notification service
   * @param {cfApplicationTabs} cfApplicationTabs - provides collection of configuration objects for tabs on the application page
   * @property {cloud-foundry.model.application} model - the Cloud Foundry Applications Model
   * @property {app.model.serviceInstance.user} userCnsiModel - the user service instance model
   * @property {string} id - the application GUID
   * @property {cfAddRoutes} cfAddRoutes - add routes service
   * @property {app.framework.widgets.dialog.frameworkDialogConfirm} frameworkDialogConfirm - the confirm dialog service
   * @property {appUtilsService} appUtilsService - the appUtilsService service
   * @property {appNotificationsService} appNotificationsService - the toast notification service
   */
  function ApplicationSummaryController($state, $stateParams, $log, $q, $translate,
                                        modelManager, cfAddRoutes, cfEditApp, appUtilsService,
                                        appClusterRoutesService, frameworkDialogConfirm, appNotificationsService,
                                        cfApplicationTabs) {
    var vm = this;

    var authModel = modelManager.retrieve('cloud-foundry.model.auth');
    vm.appCreatedInstructions = [];
    vm.appUtilsService = appUtilsService;
    vm.appClusterRoutesService = appClusterRoutesService;

    _.forEach(cfApplicationTabs.tabs, function (tab) {
      if (tab.appCreatedInstructions && tab.appCreatedInstructions.length) {
        vm.appCreatedInstructions = vm.appCreatedInstructions.concat(tab.appCreatedInstructions);
      }
    });

    vm.model = modelManager.retrieve('cloud-foundry.model.application');
    vm.userCnsiModel = modelManager.retrieve('app.model.serviceInstance.user');

    vm.id = $stateParams.guid;
    vm.cnsiGuid = $stateParams.cnsiGuid;
    vm.instanceViewLimit = 5;

    // Show a "suggested next steps" if this app is newly created (transitionned from add app flow)
    vm.newlyCreated = $stateParams.newlyCreated;

    // Hide these options by default until we can ascertain that user can perform them
    vm.hideAddRoutes = true;
    vm.hideEditApp = true;
    vm.hideManageServices = true;

    vm.routesActionMenu = [
      {
        name: 'app-route-actions.unmap',
        disabled: false,
        execute: function (route) {
          vm.appClusterRoutesService.unmapAppRoute(vm.cnsiGuid, route, route.guid, vm.id).finally(function () {
            update();
          });
        }
      },
      {
        name: 'app-route-actions.delete',
        disabled: false,
        execute: function (route) {
          vm.appClusterRoutesService.deleteRoute(vm.cnsiGuid, route, route.guid).finally(function () {
            update();
          });
        }
      }
    ];

    vm.instancesActionMenu = [
      {
        name: 'app-instances-actions.terminate',
        disabled: false,
        execute: function (instanceIndex) {
          frameworkDialogConfirm({
            title: 'terminate-instance.title',
            description: $translate.instant('terminate-instance.description', { index: instanceIndex }),
            errorMessage: 'terminate-instance.errorMessage',
            submitCommit: true,
            buttonText: {
              yes: 'terminate-instance.buttonYes',
              no: 'terminate-instance.buttonNo'
            },
            callback: function () {
              return vm.model.terminateRunningAppInstanceAtGivenIndex(vm.cnsiGuid, vm.id, instanceIndex)
                .then(function () {
                  appNotificationsService.notify('success',
                    $translate.instant('terminate.success', { index: instanceIndex }));
                  update();
                });
            }
          });
        }
      }
    ];

    vm.update = update;
    vm.isWebLink = isWebLink;
    vm.showAddRouteForm = showAddRouteForm;
    vm.editApp = editApp;
    vm.getEndpoint = getEndpoint;
    vm.formatUptime = formatUptime;

    vm.appUtilsService.chainStateResolve('cf.applications.application.summary', $state, init);

    function init() {
      // Unmap from app
      vm.routesActionMenu[0].hidden = !authModel.isAllowed(vm.cnsiGuid,
        authModel.resources.application,
        authModel.actions.update,
        vm.model.application.summary.space_guid
      );
      $log.debug('Auth Action: Unmap from app hidden: ' + vm.routesActionMenu[0].hidden);
      // delete route
      vm.routesActionMenu[1].hidden = !authModel.isAllowed(vm.cnsiGuid,
        authModel.resources.route,
        authModel.actions.delete,
        vm.model.application.summary.space_guid
      );
      $log.debug('Auth Action: Delete from app hidden: ' + vm.routesActionMenu[1].hidden);
      vm.hideRouteActions = !_.find(vm.routesActionMenu, {hidden: false});

      // hide Add Routes
      vm.hideAddRoutes = !authModel.isAllowed(vm.cnsiGuid,
        authModel.resources.route,
        authModel.actions.create, vm.model.application.summary.space_guid);
      $log.debug('Auth Action: Hide Add routes hidden: ' + vm.hideAddRoutes);

      // hide Edit App
      vm.hideEditApp = !authModel.isAllowed(vm.cnsiGuid,
        authModel.resources.application,
        authModel.actions.update, vm.model.application.summary.space_guid);
      $log.debug('Auth Action: Hide Edit App hidden: ' + vm.hideEditApp);

      // hide Manage Services
      vm.hideManageServices = !authModel.isAllowed(vm.cnsiGuid,
        authModel.resources.managed_service_instance,
        authModel.actions.create, vm.model.application.summary.space_guid);
      $log.debug('Auth Action: Hide Manage Services hidden: ' + vm.hideEditApp);

      // Terminate instance action
      vm.instancesActionMenu[0].hidden = !authModel.isAllowed(vm.cnsiGuid,
        authModel.resources.application,
        authModel.actions.update, vm.model.application.summary.space_guid);
      vm.hideInstanceActions = !_.find(vm.instancesActionMenu, {hidden: false});

      return $q.resolve();
    }

    function update() {
      return vm.appCtrl.update();
    }

    /**
     * @function isWebLink
     * @description Determine if supplies buildpack url is a web link
     * @param {string} buildpack - buildpack url guid
     * @returns {boolean} Indicating if supplies buildpack is a web link
     * @public
     **/
    function isWebLink(buildpack) {
      var url = angular.isDefined(buildpack) && buildpack !== null ? buildpack : '';
      url = url.trim().toLowerCase();
      return url.indexOf('http://') === 0 || url.indexOf('https://') === 0;
    }

    /**
     * @function showAddRouteForm
     * @description Show Add a Route form
     * @public
     **/
    function showAddRouteForm() {
      cfAddRoutes.add(vm.cnsiGuid, vm.id);
    }

    /**
     * @function editApp
     * @description Display edit app detail view
     * @public
     */
    function editApp() {
      cfEditApp.display(vm.cnsiGuid, vm.id);
    }

    function getEndpoint() {
      return vm.appUtilsService.getClusterEndpoint(vm.userCnsiModel.serviceInstances[vm.cnsiGuid]);
    }

    /**
     * @function formatUptime
     * @description format an uptime in seconds into a days, hours, minutes, seconds string
     * @param {number} uptime in seconds
     * @returns {string} formatted uptime string
     */
    function formatUptime(uptime) {
      if (angular.isUndefined(uptime) || uptime === null) {
        return '-';
      }

      function getFormattedTime(isPlural, value, unit) {
        var formatString = isPlural ? 'dateTime.plural.format' : 'dateTime.singular.format';
        return $translate.instant(formatString, { value: value, unit: unit });
      }

      if (uptime === 0) {
        return getFormattedTime(false, '0', $translate.instant('dateTime.singular.second'));
      }
      var days = Math.floor(uptime / 86400);
      uptime = uptime % 86400;
      var hours = Math.floor(uptime / 3600);
      uptime = uptime % 3600;
      var minutes = Math.floor(uptime / 60);
      var seconds = uptime % 60;

      function formatPart(count, single, plural) {
        if (count === 0) {
          return '';
        } else if (count === 1) {
          return getFormattedTime(false, count, single) + ' ';
        } else {
          return getFormattedTime(true, count, plural) + ' ';
        }
      }

      return (
      formatPart(days, $translate.instant('dateTime.singular.day'), $translate.instant('dateTime.plural.days')) +
      formatPart(hours, $translate.instant('dateTime.singular.hour'), $translate.instant('dateTime.plural.hours')) +
      formatPart(minutes, $translate.instant('dateTime.singular.minute'), $translate.instant('dateTime.plural.minutes')) +
      formatPart(seconds, $translate.instant('dateTime.singular.second'), $translate.instant('dateTime.plural.seconds')))
        .trim();
    }
  }

})();
