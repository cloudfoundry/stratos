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
    .run(setTranslationLanguage);

  function setTranslationLanguage(gettextCatalog) {
    gettextCatalog.setCurrentLanguage('en');
  }

})();
