(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application')
    .factory('cfApplicationTabs', ApplicationTabs);

  /**
   * @name cfApplicationTabs
   * @description Provides collection of configuration ojects for tabs on the application page
   * @param {object} $state - the Angular $state service
   * @returns {object} The cfApplicationTabs object
   */
  function ApplicationTabs($q, $state, $stateParams, appUtilsService, modelManager) {
    var canEditApp, cfSupportsVersions;

    var tabs = [
      {
        position: 1,
        hide: function () {
          return false;
        },
        go: goToState,
        uiSref: 'cf.applications.application.summary',
        label: 'Summary'
      },
      {
        position: 2,
        hide: function () {
          return false;
        },
        go: goToState,
        uiSref: 'cf.applications.application.log-stream',
        label: 'Log Stream'
      },
      {
        position: 3,
        hide: function () {
          return false;
        },
        go: goToState,
        uiSref: 'cf.applications.application.services',
        label: 'Services'
      },
      {
        position: 6,
        hide: function () {
          var model = modelManager.retrieve('cloud-foundry.model.application');
          if (!model.application.summary.space_guid) {
            return true;
          }
          if (angular.isUndefined(canEditApp)) {
            var cnsiGuid = $stateParams.cnsiGuid;
            var authModel = modelManager.retrieve('cloud-foundry.model.auth');

            canEditApp = authModel.isAllowed(cnsiGuid,
              authModel.resources.application,
              authModel.actions.update,
              model.application.summary.space_guid
            );
          }
          return !canEditApp;
        },
        go: goToState,
        uiSref: 'cf.applications.application.variables',
        label: 'Variables',
        clearState: function () {
          canEditApp = undefined;
        }
      },
      {
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
        go: goToState,
        uiSref: 'cf.applications.application.versions',
        label: 'Versions',
        clearState: function () {
          cfSupportsVersions = undefined;
        }
      }
    ];

    var service = {
      tabs: tabs,
      goToState: goToState,
      clearStates: clearStates
    };

    return service;

    function goToState(appId) {
      $state.go(this.uiSref, appId);
    }

    function clearStates() {
      _.forEach(service.tabs, function (tab) {
        if (_.isFunction(tab.clearState)) {
          tab.clearState();
        }
      });
    }

  }

})();
