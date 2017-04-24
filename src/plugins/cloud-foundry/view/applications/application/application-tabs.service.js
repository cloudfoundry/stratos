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
  function ApplicationTabs($state) {
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
          return false;
        },
        go: goToState,
        uiSref: 'cf.applications.application.variables',
        label: 'Variables'
      },
      {
        position: 7,
        hide: function () {
          return false;
        },
        go: goToState,
        uiSref: 'cf.applications.application.versions',
        label: 'Versions'
      }
    ];

    return {
      tabs: tabs,
      goToState: goToState
    };

    function goToState(appId) {
      $state.go(this.uiSref, appId);
    }

  }

})();
