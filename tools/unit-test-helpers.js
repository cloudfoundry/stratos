(function () {
  'use strict';

  beforeEach(module('pascalprecht.translate', function ($injector) {
    var $translateProvider = $injector.get('$translateProvider');
    jasmine.getJSONFixtures().fixturesPath = 'base/dist/i18n';
    var json = getJSONFixture('locale-en.json');
    $translateProvider.translations('en', json);
  }));

})();
