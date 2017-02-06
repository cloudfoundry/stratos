(function () {
  'use strict';

  var angularModules = [
    'ngCookies',
    'ngSanitize'
  ];

  var otherModules = [
    'stackato-templates',
    'angularMoment',
    'gettext',
    'helion.framework',
    'smoothScroll',
    'ui.bootstrap',
    'ui.router',
    'smart-table',
    'ig.linkHeaderParser'
  ];

  var pluginModules = _.chain(env.plugins).map('moduleName').value();

  /**
   * @namespace green-box-console
   * @name green-box-console
   */
  angular
    .module('green-box-console', angularModules.concat(otherModules, ['app'], pluginModules), config);

  config.$inject = [
    '$compileProvider',
    '$logProvider'
  ];

  function config($compileProvider, $logProvider) {

    /**
     * Disabling Debug Data
     *
     * To manually enable debug data, open up a debug console in the browser
     * then call this method directly in this console:
     *
     * ```
     * angular.reloadWithDebugInfo();
     * ```
     *
     * https://docs.angularjs.org/guide/production
     */
    $compileProvider.debugInfoEnabled(false);

    $logProvider.debugEnabled(false);
  }

})();
