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
    .constant('app.basePath', 'app/')
    .constant('app.config', {
      pagination: {
        pageSize: 48
      },
      loadingLimit: 100,
      showLanguageSelection: false
    })
    .run(setTranslationLanguage)
    .run(setOEMTranslations);

  setTranslationLanguage.$inject = [
    'gettextCatalog'
  ];

  function setTranslationLanguage(gettextCatalog) {
    gettextCatalog.setCurrentLanguage('en');
  }

  setOEMTranslations.$inject = [
    '$window', '$rootScope'
  ];

  function setOEMTranslations($window, $rootScope) {
    $rootScope.OEM_CONFIG = $window.env.OEM_CONFIG;
  }

})();
