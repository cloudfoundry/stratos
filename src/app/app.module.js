(function () {
  'use strict';

  /**
   * @namespace app
   * @name app
   */
  angular
    .module('app', [
      'app.api',
      'app.error',
      'app.event',
      'app.logged-in',
      'app.model',
      'app.view',
      'app.utils'
    ])
    .constant('app.basePath', 'app/')
    .constant('app.config', {
      pagination: {
        pageSize: 48
      },
      loadingLimit: 100
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
    '$window', 'gettextCatalog'
  ];

  function setOEMTranslations($window, gettextCatalog) {
    if ($window.env) {
      if ($window.env.DEFAULT_PRODUCT_STRINGS) {
        gettextCatalog.setStrings('en', DEFAULT_PRODUCT_STRINGS);
      }

      if ($window.env.PRODUCT_STRINGS) {
        var PRODUCT_STRINGS = $window.env.PRODUCT_STRINGS;
        if (PRODUCT_STRINGS !== '$PRODUCT_STRINGS$') {
          gettextCatalog.setStrings('en', PRODUCT_STRINGS);
        }
      }
    }
  }

})();
