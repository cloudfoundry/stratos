(function () {
  'use strict';

  var angularModules = [
    'ngCookies',
    'ngSanitize'
  ];

  var otherModules = [
    'angularMoment',
    'gettext',
    'helion.framework',
    'smoothScroll',
    'ui.bootstrap',
    'ui.router',
    'smart-table',
    'http-etag',
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
    '$logProvider',
    'httpEtagProvider'
  ];

  function config($compileProvider, $logProvider, httpEtagProvider) {

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

    // Use Etags to resolve caching issues on application upgrade
    httpEtagProvider.cache('default');
    
    // Disbale debug logging
    $logProvider.debugEnabled(false);

  }

})();
