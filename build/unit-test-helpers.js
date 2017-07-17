(function () {
  'use strict';

  beforeEach(module('pascalprecht.translate', function ($injector) {
    var $translateProvider = $injector.get('$translateProvider');
    jasmine.getJSONFixtures().fixturesPath = 'base/dist/i18n';
    var json = getJSONFixture('locale-en_US.json');
    $translateProvider.translations('en_US', json);

    // Would be nicer to do this in a way that covers all locales, however can't find a way to change the locale of
    // phantomjs or override the $translate.resolveClientLocale function in a global clean way
    $translateProvider.translations('en_GB', json);
  }));

  beforeEach(module('console-templates'));

  beforeEach(function () {
    localStorage.clear();
  });

})();
