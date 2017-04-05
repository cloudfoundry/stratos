(function () {
  'use strict';

  /**
   * @namespace app
   * @name app
   */
  angular
    .module('app', [
      'app.api',
      'app.model',
      'app.view',
      'app.utils'
    ])
    .constant('appBasePath', 'app/')
    .run(setTranslationLanguage)
    .run(setOEMTranslations);

  function setTranslationLanguage(gettextCatalog) {
    gettextCatalog.setCurrentLanguage('en');
  }

  function setOEMTranslations($window, $rootScope) {
    $rootScope.OEM_CONFIG = $window.env.OEM_CONFIG;
  }

})();
