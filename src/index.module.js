(function () {
  'use strict';

  var angularModules = [
    'ngSanitize'
  ];

  var otherModules = [
    'gettext',
    'helion.framework',
    'ui.bootstrap',
    'ui.router'
  ];

  angular
    .module('green-box-ui', [
      'app'
    ]
    .concat(angularModules)
    .concat(otherModules),
    config
  );

  config.$inject = [
    '$compileProvider'
  ];

  function config($compileProvider) {

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
  }

})();
