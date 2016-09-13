(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.versions', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cf.applications.application.versions', {
      url: '/versions',
      templateUrl: 'plugins/cloud-foundry/view/applications/application/versions/versions.html',
      controller: ApplicationVersionsController,
      controllerAs: 'applicationVersionsCtrl'
    });
  }

  ApplicationVersionsController.$inject = [
    '$q',
    '$interpolate',
    '$stateParams',
    '$scope',
    '$timeout',
    '$state',
    'app.model.modelManager',
    'helion.framework.widgets.dialog.confirm',
    'app.view.notificationsService',
    'app.utils.utilsService'
  ];

  /**
   * @name ApplicationVersionsController
   * @constructor
   * @param {object} $q - angular $q service
   * @param {object} $interpolate - the angular $interpolate service
   * @param {object} $stateParams - the UI router $stateParams service
   * @param {object} $scope - the angular $scope service
   * @param {object} $timeout - the angular $timeout service
   * @param {object} $state - the UI router $state service
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {object} confirmDialog - the confirm dialog service
   * @param {app.view.notificationsService} notificationsService - the toast notification service
   * @param {object} utilsService - Utils service
   * @property {object} $q - angular $q service
   * @property {object} $interpolate - the angular $interpolate service
   * @property {object} versionModel - the Cloud Foundry Application Versions Model
   * @property {string} cnsiGuid - the HCF Endpoint GUID
   * @property {string} id - the application GUID
   * @property {object} confirmDialog - the confirm dialog service
   */
  function ApplicationVersionsController($q, $interpolate, $stateParams, $scope, $timeout, $state, modelManager, confirmDialog, notificationsService, utilsService) {
    var that = this;
    this.$q = $q;
    this.$interpolate = $interpolate;
    this.versionModel = modelManager.retrieve('cloud-foundry.model.appVersions');
    this.appModel = modelManager.retrieve('cloud-foundry.model.application');
    this.cnsiGuid = $stateParams.cnsiGuid;
    this.id = $stateParams.guid;
    this.confirmDialog = confirmDialog;
    this.notificationsService = notificationsService;
    this.$timeout = $timeout;

    this.isBusy = false;
    this.fetchError = false;
    this.deleteError = false;
    this.disableRollbackAction = true;
    this.versions = [];

    this.refreshVersions(true);

    $scope.$watch(function () {
      return that.appModel.application.summary.package_updated_at;
    }, function (nv, ov) {
      if (nv && nv !== ov) {
        $timeout(_.bind(that.refreshVersions, that), 2500);
      }
    });

    $scope.$watch(function () {
      return that.appModel.application.state ? that.appModel.application.state.label : undefined;
    }, function (nv, ov) {
      if (nv && nv !== ov) {
        that.refreshVersions(false);
      }
    });

    function init() {

      var authModel = modelManager.retrieve('cloud-foundry.model.auth');
      // Keep rollback action disabled if user does not
      // have permissions to update applications
      that.disableRollbackAction = !authModel.isAllowed(that.cnsiGuid,
        authModel.resources.application,
        authModel.actions.update,
        that.appModel.application.summary.space_guid);
    }

    utilsService.chainStateResolve('cf.applications.application.versions', $state, init);

  }

  angular.extend(ApplicationVersionsController.prototype, {
    /**
     * @function hasVersions
     * @description Determines if the application has version metadata
     * @returns {boolean} Indicating if the application has version metadata
     * @public
     **/
    hasVersions: function () {
      return this.versions && this.versions.length;
    },

    /**
     * @function rollback
     * @description Prompt the user and perform rollback to the specified version
     * @param {object} v - version to rollback to
     * @public
     **/
    rollback: function (v) {
      var that = this;
      var confirmMessage = gettext('Are you sure you want to rollback to version "{{version}} ?');
      confirmMessage = that.$interpolate(confirmMessage)({version: v.guid});
      this.confirmDialog({
        title: gettext('Rollback Application to previous Version'),
        description: confirmMessage,
        buttonText: {
          yes: gettext('Rollback'),
          no: gettext('Cancel')
        },
        callback: function () {
          return that.versionModel.rollback(that.cnsiGuid, that.id, v.guid).then(function () {
            var message = gettext('Application was successfully rolled back');
            that.notificationsService.notify('success', message);
            that.refreshVersions();
          }).catch(function () {
            return that.$q.reject(gettext('Failed to rollback to previous version'));
          });
        }
      });
    },

    /**
     * @function refreshVersions
     * @description Refreshes the application versions from HCF
     * @param {boolean} showBusy - whether or not to show the busy indicator (typiaclly only used on first load)
     * @public
     **/
    refreshVersions: function (showBusy) {
      var that = this;
      this.isBusy = !!showBusy;
      this.fetchError = false;
      this.versionModel.list(this.cnsiGuid, this.id)
        .then(function () {
          that.fetchError = false;
          that.versions = that.versionModel.versions;
        })
        .catch(function () {
          that.fetchError = true;
          that.versions = [];
        })
        .finally(function () {
          that.isBusy = false;
        });
    }
  });
})();
