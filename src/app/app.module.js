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
      }
    })
    .run(setTranslationLanguage);

  setTranslationLanguage.$inject = [
    'gettextCatalog'
  ];

  function setTranslationLanguage(gettextCatalog) {
    gettextCatalog.setCurrentLanguage('en');
  }

})();
