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
    '$window', '$rootScope'
  ];

  function setOEMTranslations($window, $rootScope) {
    $rootScope.PRODUCT_STRINGS = _.defaults($window.env.PRODUCT_STRINGS, $window.env.DEFAULT_PRODUCT_STRINGS);
  }

})();
