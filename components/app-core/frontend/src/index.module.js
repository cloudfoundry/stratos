(function () {
  'use strict';

  var angularModules = [
    'ngCookies',
    'ngSanitize'
  ];

  var otherModules = [
    'console-templates',
    'angularMoment',
    'app.framework',
    'smoothScroll',
    'ui.bootstrap',
    'ui.router',
    'smart-table',
    'pascalprecht.translate'
  ];

  var pluginModules = _.chain(env.plugins).map('moduleName').value();

  /**
   * @namespace console-app
   * @name console-app
   */
  angular
    .module('console-app', angularModules.concat(otherModules, ['app'], pluginModules), config);

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
