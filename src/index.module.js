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
    'ig.linkHeaderParser',
    'pascalprecht.translate'
  ];

  var pluginModules = _.chain(env.plugins).map('moduleName').value();

  /**
   * @namespace green-box-console
   * @name green-box-console
   */
  angular
    .module('green-box-console', angularModules.concat(otherModules, ['app'], pluginModules), config)
    .factory('missingTranslateHandler', missingTranslateHandler);

  config.$inject = [
    '$compileProvider',
    '$logProvider',
    '$translateProvider'
  ];

  function config($compileProvider, $logProvider, $translateProvider) {

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

    // Configure i18n
    $translateProvider.preferredLanguage('en');
    $translateProvider.fallbackLanguage('en');
    //$translateProvider.addInterpolation('gettext');
    $translateProvider.useSanitizeValueStrategy(null);

    $translateProvider.useStaticFilesLoader({
      prefix: '/i18n/locale-',
      suffix: '.json'
    });

    // Uncomment this for development to see which strings need localizing
    $translateProvider.useMissingTranslationHandler('missingTranslateHandler');
  }

  missingTranslateHandler.$inject = [
    '$log'
  ];

  // Custom missing translation handler only logs each missing translation id once
  function missingTranslateHandler($log) {

    var seen = {};

    return function (translationId) {
      if (!seen[translationId]) {
        $log.warn('Missing translation for "' + translationId + '"');
        seen[translationId] = true;
      }

      // Highlight missing translations
      return '<span class="i18n-missing">' + translationId + '</span>';
    };
  }

})();
