(function () {
  'use strict';

  angular
    .module('cf-versions.view', [])
    .config(registerRoute)
    .run(registerAppTab);

  function registerRoute($stateProvider) {
    $stateProvider.state('cf.applications.application.versions', {
      url: '/versions',
      templateUrl: 'plugins/cf-versions/view/versions/versions.html',
      controller: ApplicationVersionsController,
      controllerAs: 'applicationVersionsCtrl'
    });
  }

  function registerAppTab($stateParams, $q, cfApplicationTabs, modelManager) {
    var cfSupportsVersions;
    cfApplicationTabs.tabs.push({
      position: 7,
      hide: function () {
        if (angular.isUndefined(cfSupportsVersions)) {
          var id = $stateParams.guid;
          var cnsiGuid = $stateParams.cnsiGuid;
          var versions = modelManager.retrieve('cloud-foundry.model.appVersions');
          cfSupportsVersions = versions.hasVersionSupport(cnsiGuid);
          var promise;
          if (angular.isDefined(cfSupportsVersions)) {
            promise = $q.when(cfSupportsVersions);
          } else {
            cfSupportsVersions = false;
            promise = versions.list(cnsiGuid, id, true);
          }

          promise.then(function () {
            cfSupportsVersions = !!versions.hasVersionSupport(cnsiGuid);
          });
        }
        return !cfSupportsVersions;
      },
      uiSref: 'cf.applications.application.versions',
      label: 'Versions',
      clearState: function () {
        cfSupportsVersions = undefined;
      }
    });
  }

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
   * @param {object} frameworkDialogConfirm - the confirm dialog service
   * @param {app.view.appNotificationsService} appNotificationsService - the toast notification service
   * @param {object} appUtilsService - appUtilsService service
   */
  function ApplicationVersionsController($q, $interpolate, $stateParams, $scope, $timeout, $state, modelManager,
                                         frameworkDialogConfirm, appNotificationsService, appUtilsService) {
    var vm = this;
    var versionModel = modelManager.retrieve('cloud-foundry.model.appVersions');
    var appModel = modelManager.retrieve('cloud-foundry.model.application');
    var cnsiGuid = $stateParams.cnsiGuid;
    var id = $stateParams.guid;

    vm.isBusy = false;
    vm.fetchError = false;
    vm.disableRollbackAction = true;
    vm.versions = [];
    vm.actions = [{
      name: gettext('Rollback'),
      disabled: vm.disableRollbackAction,
      execute: function (v) {
        return rollback(v);
      }
    }];

    vm.hasVersions = hasVersions;
    vm.rollback = rollback;

    refreshVersions(true);

    $scope.$watch(function () {
      return appModel.application.summary.package_updated_at;
    }, function (nv, ov) {
      if (nv && nv !== ov) {
        $timeout(_.bind(refreshVersions, vm), 2500);
      }
    });

    $scope.$watch(function () {
      return appModel.application.state ? appModel.application.state.label : undefined;
    }, function (nv, ov) {
      if (nv && nv !== ov) {
        refreshVersions(false);
      }
    });

    appUtilsService.chainStateResolve('cf.applications.application.versions', $state, init);

    function init() {

      var authModel = modelManager.retrieve('cloud-foundry.model.auth');
      // Keep rollback action disabled if user does not
      // have permissions to update applications
      vm.disableRollbackAction = !authModel.isAllowed(cnsiGuid,
        authModel.resources.application,
        authModel.actions.update,
        appModel.application.summary.space_guid);
      vm.actions[0].disabled = vm.disableRollbackAction;

      return $q.resolve();
    }

    /**
     * @function hasVersions
     * @description Determines if the application has version metadata
     * @returns {boolean} Indicating if the application has version metadata
     * @public
     **/
    function hasVersions() {
      return vm.versions && vm.versions.length;
    }

    /**
     * @function rollback
     * @description Prompt the user and perform rollback to the specified version
     * @param {object} v - version to rollback to
     * @public
     **/
    function rollback(v) {
      var confirmMessage = gettext('Are you sure you want to rollback to version "{{version}} ?');
      confirmMessage = $interpolate(confirmMessage)({version: v.guid});
      frameworkDialogConfirm({
        title: gettext('Rollback Application to previous Version'),
        description: confirmMessage,
        submitCommit: true,
        buttonText: {
          yes: gettext('Rollback'),
          no: gettext('Cancel')
        },
        callback: function () {
          return versionModel.rollback(cnsiGuid, id, v.guid).then(function () {
            var message = gettext('Application was successfully rolled back');
            appNotificationsService.notify('success', message);
            refreshVersions();
          }).catch(function () {
            return $q.reject(gettext('Failed to rollback to previous version'));
          });
        }
      });
    }

    /**
     * @function refreshVersions
     * @description Refreshes the application versions from CF
     * @param {boolean} showBusy - whether or not to show the busy indicator (typiaclly only used on first load)
     * @public
     **/
    function refreshVersions(showBusy) {
      vm.isBusy = !!showBusy;
      vm.fetchError = false;
      versionModel.list(cnsiGuid, id)
        .then(function () {
          vm.fetchError = false;
          vm.versions = versionModel.versions;
        })
        .catch(function () {
          vm.fetchError = true;
          vm.versions = [];
        })
        .finally(function () {
          vm.isBusy = false;
        });
    }
  }
})();
