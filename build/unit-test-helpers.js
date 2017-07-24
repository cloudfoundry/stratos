(function () {
  'use strict';

  beforeEach(module('console-app', function ($injector) {
    // Override whatever language the running browser is in, this removes unexpected http request to
    // locale_<browser locale>.json
    var languageServiceProvider = $injector.get('languageServiceProvider');
    languageServiceProvider.setBrowserLocale('en_US');
  }));

  beforeEach(module('pascalprecht.translate', function ($injector) {
    var $translateProvider = $injector.get('$translateProvider');
    jasmine.getJSONFixtures().fixturesPath = 'base/dist/i18n';
    var json = getJSONFixture('locale-en_US.json');
    $translateProvider.translations('en_US', json);
  }));

  beforeEach(module('console-templates'));

  beforeEach(function () {
    localStorage.clear();
  });

})();
