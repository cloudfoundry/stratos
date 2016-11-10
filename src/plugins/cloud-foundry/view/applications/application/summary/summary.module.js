(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.summary', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cf.applications.application.summary', {
      url: '/summary',
      templateUrl: 'plugins/cloud-foundry/view/applications/application/summary/summary.html',
      controller: ApplicationSummaryController,
      controllerAs: 'applicationSummaryCtrl'
    });
  }

  ApplicationSummaryController.$inject = [
    '$state',
    '$stateParams',
    '$log',
    '$q',
    '$scope',
    '$filter',
    'app.model.modelManager',
    'cloud-foundry.view.applications.application.summary.addRoutes',
    'cloud-foundry.view.applications.application.summary.editApp',
    'app.utils.utilsService',
    'app.view.endpoints.clusters.routesService',
    'helion.framework.widgets.dialog.confirm',
    'app.view.notificationsService'
  ];

  /**
   * @name ApplicationSummaryController
   * @constructor
   * @param {object} $state - UI Router $state
   * @param {object} $stateParams - the UI router $stateParams service
   * @param {object} $log - the angular $log service
   * @param {object} $q - the angular $q service
   * @param {object} $scope - the Angular $scope service
   * @param {object} $filter - the Angular $filter service
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {cloud-foundry.view.applications.application.summary.addRoutes} addRoutesService - add routes service
   * @param {cloud-foundry.view.applications.application.summary.editapp} editAppService - edit Application
   * @param {app.model.utilsService} utils - the utils service
   * @param {app.view.endpoints.clusters.routesService} routesService - the Service management service
   * @property {helion.framework.widgets.dialog.confirm} confirmDialog - the confirm dialog service
   * @param {app.view.notificationsService} notificationsService - the toast notification service
   * @property {cloud-foundry.model.application} model - the Cloud Foundry Applications Model
   * @property {app.model.serviceInstance.user} userCnsiModel - the user service instance model
   * @property {string} id - the application GUID
   * @property {cloud-foundry.view.applications.application.summary.addRoutes} addRoutesService - add routes service
   * @property {helion.framework.widgets.dialog.confirm} confirmDialog - the confirm dialog service
   * @property {app.model.utilsService} utils - the utils service
   * @property {helion.framework.widgets.dialog.confirm} confirmDialog - the confirm dialog service
   * @property {app.view.notificationsService} notificationsService - the toast notification service
   */
  function ApplicationSummaryController($state, $stateParams, $log, $q, $scope, $filter,
                                        modelManager, addRoutesService, editAppService, utils,
                                        routesService, confirmDialog, notificationsService) {

    this.model = modelManager.retrieve('cloud-foundry.model.application');
    this.userCnsiModel = modelManager.retrieve('app.model.serviceInstance.user');
    this.authModel = modelManager.retrieve('cloud-foundry.model.auth');
    this.routesService = routesService;
    this.id = $stateParams.guid;
    this.cnsiGuid = $stateParams.cnsiGuid;
    this.addRoutesService = addRoutesService;
    this.editAppService = editAppService;
    this.confirmDialog = confirmDialog;
    this.notificationsService = notificationsService;
    this.utils = utils;
    this.$log = $log;
    this.$q = $q;
    this.instanceViewLimit = 5;

    this.update = _.get($scope, '$parent.appCtrl.updateSummary') || angular.noop;

    // Hide these options by default until we can ascertain that user can perform them
    this.hideAddRoutes = true;
    this.hideEditApp = true;
    this.hideManageServices = true;

    var that = this;
    this.routesActionMenu = [
      {
        name: gettext('Unmap from App'),
        disabled: true,
        execute: function (route) {
          routesService.unmapAppRoute(that.cnsiGuid, route, route.guid, that.id).finally(function () {
            that.update();
          });
        }
      },
      {
        name: gettext('Delete Route'),
        disable: true,
        execute: function (route) {
          routesService.deleteRoute(that.cnsiGuid, route, route.guid).finally(function () {
            that.update();
          });
        }
      }
    ];

    this.instancesActionMenu = [
      {
        name: gettext('Terminate Instance'),
        disabled: true,
        execute: function (instanceIndex) {
          var deferred = that.$q.defer();
          var dialog = that.confirmDialog({
            title: gettext('Terminate Instance'),
            description: gettext('Are you sure you want to delete Instance ') + instanceIndex + '?',
            errorMessage: gettext('There was a problem deleting this instance. Please try again. If this error persists, please contact the Administrator.'),
            buttonText: {
              yes: gettext('Delete'),
              no: gettext('Cancel')
            },
            callback: function () {
              return that.model.terminateRunningAppInstanceAtGivenIndex(that.cnsiGuid, that.id, instanceIndex)
                .then(function () {
                  that.notificationsService.notify('success', gettext('Instance successfully deleted'));
                  deferred.resolve();
                })
                .catch(function (error) {
                  deferred.reject(error);
                  return that.$q.reject();
                })
                .finally(function () {
                  that.update();
                });
            }
          });
          return dialog.result.catch(function () {
            deferred.reject();
            return that.$q.reject();
          });
        }
      }
    ];

    function init() {
      // Filter out the stackato hce service
      that.serviceInstances = $filter('removeHceServiceInstance')(that.model.application.summary.services, that.id);

      // Unmap from app
      that.routesActionMenu[0].disabled = !that.authModel.isAllowed(that.cnsiGuid,
        that.authModel.resources.application,
        that.authModel.actions.update,
        that.model.application.summary.space_guid
      );
      that.$log.debug('Auth Action: Unmap from app disabled: ' + that.routesActionMenu[0].disabled);
      // delete route
      that.routesActionMenu[1].disabled = !that.authModel.isAllowed(that.cnsiGuid,
        that.authModel.resources.route,
        that.authModel.actions.delete,
        that.model.application.summary.space_guid
      );
      that.$log.debug('Auth Action: Delete from app disabled: ' + that.routesActionMenu[1].disabled);

      // hide Add Routes
      that.hideAddRoutes = !that.authModel.isAllowed(that.cnsiGuid,
        that.authModel.resources.route,
        that.authModel.actions.create, that.model.application.summary.space_guid);
      that.$log.debug('Auth Action: Hide Add routes disabled: ' + that.hideAddRoutes);

      // hide Edit App
      that.hideEditApp = !that.authModel.isAllowed(that.cnsiGuid,
        that.authModel.resources.application,
        that.authModel.actions.update, that.model.application.summary.space_guid);
      that.$log.debug('Auth Action: Hide Edit App disabled: ' + that.hideEditApp);

      // hide Manage Services
      that.hideManageServices = !that.authModel.isAllowed(that.cnsiGuid,
        that.authModel.resources.managed_service_instance,
        that.authModel.actions.create, that.model.application.summary.space_guid);
      that.$log.debug('Auth Action: Hide Manage Services disabled: ' + that.hideEditApp);

      // Terminate instance action
      that.instancesActionMenu[0].disabled = !that.authModel.isAllowed(that.cnsiGuid,
        that.authModel.resources.application,
        that.authModel.actions.update, that.model.application.summary.space_guid);

      return that.$q.resolve();
    }

    this.utils.chainStateResolve('cf.applications.application.summary', $state, init);

  }

  angular.extend(ApplicationSummaryController.prototype, {
    /**
     * @function isWebLink
     * @description Determine if supplies buildpack url is a web link
     * @param {string} buildpack - buildpack url guid
     * @returns {boolean} Indicating if supplies buildpack is a web link
     * @public
     **/
    isWebLink: function (buildpack) {
      var url = angular.isDefined(buildpack) && buildpack !== null ? buildpack : '';
      url = url.trim().toLowerCase();
      return url.indexOf('http://') === 0 || url.indexOf('https://') === 0;
    },

    /**
     * @function showAddRouteForm
     * @description Show Add a Route form
     * @public
     **/
    showAddRouteForm: function () {
      this.addRoutesService.add(this.cnsiGuid, this.id);
    },

    /**
     * @function editApp
     * @description Display edit app detail view
     * @public
     */
    editApp: function () {
      this.editAppService.display(this.cnsiGuid, this.id);
    },

    getEndpoint: function () {
      return this.utils.getClusterEndpoint(this.userCnsiModel.serviceInstances[this.cnsiGuid]);
    },

    /**
     * @function formatUptime
     * @description format an uptime in seconds into a days, hours, minutes, seconds string
     * @param {number} uptime in seconds
     * @returns {string} formatted uptime string
     */
    formatUptime: function (uptime) {
      if (angular.isUndefined(uptime) || uptime === null) {
        return '-';
      }
      if (uptime === 0) {
        return '0' + gettext('s');
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
          return count + single + ' ';
        } else {
          return count + plural + ' ';
        }
      }

      return (formatPart(days, gettext('d'), gettext('d')) +
      formatPart(hours, gettext('h'), gettext('h')) +
      formatPart(minutes, gettext('m'), gettext('m')) +
      formatPart(seconds, gettext('s'), gettext('s'))).trim();
    }
  });

})();
