(function () {
  'use strict';

  describe('roles-smart-search directive', function () {
    var $httpBackend, element;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      var $compile = $injector.get('$compile');

      var contextScope = $injector.get('$rootScope').$new();
      contextScope.stTable = [];
      contextScope.rolesSmartSearch = '';
      contextScope.rolesSmartSearchBy = undefined;
      contextScope.rolesSmartSearchDisable = undefined;

      var markup = '<div ' +
        'st-table="stTable" ' +
        'roles-smart-search="rolesSmartSearch">' +
        'roles-smart-search-by="rolesSmartSearchBy">' +
        'roles-smart-search-disable="rolesSmartSearchDisable">' +
        '</div>';

      element = angular.element(markup);
      $compile(element)(contextScope);

      contextScope.$apply();
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should be defined', function () {
      expect(element).toBeDefined();
    });

  });

})();
