(function () {
  'use strict';

  /**
   * @namespace app
   * @name app
   */
  angular
    .module('app', [
      'app.api',
      'app.event',
      'app.model',
      'app.view',
      'app.utils',
      'app.service'
    ])
    .constant('app.basePath', 'app/')
    .run(setTranslationLanguage);

  setTranslationLanguage.$inject = [
    'gettextCatalog'
  ];

  function setTranslationLanguage(gettextCatalog) {
    gettextCatalog.setCurrentLanguage('en');
  }

})();
